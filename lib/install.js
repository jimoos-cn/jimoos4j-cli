/*
 * 安装插件
 * @Author: qisheng.chen
 * @Date: 2020-02-13 10:25:55
 * @Last Modified by: qisheng.chen
 * @Last Modified time: 2020-11-27 17:38:11
 */
const appYmlPath = "app.yml";
const shellJs = require('shelljs');
const Schema = require('validate');
const fse = require('fs-extra');
const {gitCloneOrPull, refreshAddonPom, copyAddon} = require('./init');
const _template = require('lodash/template');
const _forEach = require('../lib/forEach');
const colors = require('colors');
const yamlUtil = require('../lib/yamlUtil');
const arrayUtil = require('../lib/arrayUtil');
const util = require('util');
const rimraf = require('rimraf');
const rimrafPromise = util.promisify(rimraf)

let _appPath = '';

async function install(pull, options) {
    try {
        let opStr = pull ? '更新' : '安装';
        console.log('%s', '开始' + opStr + '插件列表...')
        // 默认 未指定 git URI 则 从 git@github.com:jimoos-cn 获取
        const defaultRemote = _template("git@github.com:jimoos-cn/${ref}.git")
        const addonCacheDir = '.addonCache';
        const addonDir = 'addons/depends';
        _appPath = shellJs.pwd().stdout;
        if (fse.existsSync(appYmlPath)) {
            let doc = validApp();
            if (options && options.deleteOrigin) {
                //如果是 强制更新 则 删除addons/depends 下的代码
                await cleanDependOn(addonDir);
                fse.mkdirsSync(addonDir);
            }
            await _forEach(doc.App.Addons, async element => {
                if (options && options.object && element.Name != options.object) {
                    return;
                }
                if (element.SourceType === 'git') {
                    if (element.Source) {
                        //如果有填写地址 则直接用 git 地址
                        await gitCloneOrPull(element.Source, addonCacheDir, element.Ref, pull);
                    } else {
                        //如果不存在地址 则直接用默认地址
                        await gitCloneOrPull(defaultRemote({ref: element.Ref}), addonCacheDir, element.Ref, pull);
                    }
                }
                shellJs.cd(_appPath);
                await copyAddon(element.Name, element.Ref, ".addonCache/" + element.Ref + '/addons/@', addonDir, element.Group);
            })
            refreshAddonPom();
        } else {
            console.error("未找到 %s 文件", colors.bold('app.yml'));
        }
        console.log('%s', '插件列表' + opStr + colors.green('完成'))
    } catch (error) {
        console.error(error);
    }
};

/**
 * 验证app.yml 配置文件 有效性
 */
function validApp() {
    //基础的验证配置
    const appSchema = new Schema({
        App: {
            Name: {
                type: String,
                required: true
            },
            Author: {
                type: String
            },
            Description: {
                type: String
            },
            Addons: [
                {
                    Name: {
                        type: String,
                        required: true
                    },
                    Ref: {
                        type: String,
                        required: true
                    },
                    Group: {
                        type: String
                    },
                    SourceType: {
                        type: String,
                        enum: ['git']
                    },
                    Source: {
                        type: String,
                    },
                    Type: {
                        type: String,
                        required: true,
                        enum: ['module', 'app', 'extend']
                    },
                    DependOns: {
                        type: String,
                    },
                    Conflicts: {
                        type: String,
                    },
                    Migrations: {
                        type: String,
                    },
                    Docs: {
                        type: String,
                    },
                    DataSources: {
                        type: String,
                        enum: ['none', 'graphQL', 'postgresSQL']
                    },
                }
            ]
        }
    })

    if (fse.existsSync(appYmlPath)) {
        const doc = yamlUtil.loadYaml(appYmlPath)
        const errors = appSchema.validate(doc)
        if (errors && errors.length > 0) {
            console.error('app.yml has errors:' + errors)
            process.exit(1)
        } else {
            validAddons(doc.App.Addons);
            return doc;
        }
    } else {
        console.error('app.yml is not exist on app')
        process.exit(1)
    }
}

/**
 * 开始清理 原来的依赖代码
 * @returns {Promise<void>}
 */
async function cleanDependOn(addOnSrc) {
    console.log('开始清理depends文件');
    await rimrafPromise(addOnSrc);
    console.log('清理插件depends文件' + colors.green('完成'))
}

/**
 * 验证插件列表
 * @param {插件描述} addons
 */
function validAddons(addons) {
    var dependons = new Set([]);
    var conflicts = new Set([]);
    //规则一 type 为 extend 必须有 DependOns 且必须再配置中。
    addons.forEach(element => {
        if (element.DependOns && element.DependOns != 'none') {
            dependons = arrayUtil.union(dependons, element.DependOns.split(','))
        }

        if (element.Conflicts && element.Conflicts != 'none') {
            conflicts = arrayUtil.union(conflicts, element.Conflicts.split(','));
        }

        if (element.Type == 'extend') {
            if (element.DependOns == 'none' || !element.DependOns) {
                console.error('extend模块[' + element.Name + ']必须有个依赖模块DependOns')
                process.exit(1)
            }
        }
    });

    addons.forEach(element => {
        if (dependons.has(element.Name)) {
            dependons.delete(element.Name)
        }
    });
    if (dependons.size > 0) {
        dependons.forEach(function (value) {
            console.error('dependOns:' + value + " not found at app.yml")
        });
        process.exit(1);
    }

    //规则二 检测冲突 Conflicts
    addons.forEach(element => {
        if (conflicts.has(element.Name)) {
            console.error('conflict addon [' + element.Name + "] found at app.yml")
            process.exit(1);
        }
    });
}

module.exports.install = install;
module.exports.validApp = validApp;
module.exports.update = async function (options) {
    install(true, options)
}
