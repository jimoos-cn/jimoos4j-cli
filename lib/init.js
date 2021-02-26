/*
 * 初始化 项目
 * @Author: qisheng.chen
 * @Date: 2020-02-11 18:33:59
 * @Last Modified by: qisheng.chen
 * @Last Modified time: 2020-11-27 17:35:59
 */
const inquirer = require('inquirer');
const colors = require('colors');
const pad = require('pad');
const values = require('../lib/values');
const Schema = require('validate');
const yamlUtil = require('../lib/yamlUtil');

const fs = require('fs');
const fse = require('fs-extra');
const Mustache = require('Mustache')
const path = require('path');
const util = require('util');
const shellJs = require('shelljs');
const _template = require('lodash/template');
const _endsWith = require('lodash/endsWith');
const _forEach = require('../lib/forEach');

const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const {ncpSync, ls} = require('../lib/fsTool');

let ncpAllOption = {
    filter: function (file) {
        return true;
    }
}

const questions = [
    {type: 'input', name: 'Name', message: '应用名称(请输入英文)'},
    {type: 'input', name: 'Tag', message: '应用分组(请输入英文)'},
    {type: 'input', name: 'Description', message: '应用描述'},
    {type: 'checkbox', name: 'Addons', message: '选择应用插件', choices: values.addons},
];

module.exports = function () {
    inquirer
        .prompt(questions)
        .then(async function (answers) {
            console.log('应用配置如下');
            console.log('------------------');

            console.log(pad(colors.grey('应用名称: '), 30), answers.Name);
            console.log(pad(colors.grey('应用分组: '), 30), answers.Tag);
            console.log(pad(colors.grey('应用描述: '), 30), answers.Description);
            console.log(pad(colors.grey('应用插件: '), 30), answers.Addons);
            console.log('------------------');
            try {
                await mkAppDir(answers.Name)
                await mkAppYml(answers.Name, answers)
                await loadAddons(answers.Name, answers);
                goToAppParentDir();
                await refreshAddonPom(answers.Name);
                // await migrateBuild(answers.Name);
                console.log('%s', colors.bold(answers.Name) + ' 初始化' + colors.green('完成'))
            } catch (error) {
                console.error(error);
            }
        });
};

async function mkAppDir(appName) {
    console.log('%s %s', colors.grey('新建应用文件: '), colors.bold(appName))
    await mkdir(appName);
    //新建 cache 缓存
    await mkdir(appName + '/' + '.addonCache');
}

/**
 * 模板 渲染，并写入文件
 * @param src
 * @param dist
 * @param view
 * @returns {Promise<void>}
 */
async function renderAndWriteTo(src, dist, view) {
    const res = await render(src, view)
    await writeFile(dist, res);
}


/**
 * 构建 APP的 yml 配置
 * @param {String} appName 应用名称
 * @param {Object} answers 回答
 */
async function mkAppYml(appName, answers) {
    let view = {
        Name: answers.Name,
        Description: answers.Description,
        Addons: []
    };

    let templateView = {
        FunctionName: answers.Name,
        ServiceName: !answers.Tag ? 'jimo' : answers.Tag
    }

    values.addons.forEach(element => {
        if (answers.Addons.indexOf(element.value) != -1) {
            view.Addons.push(element);
        }
    });
    await ncpSync(path.join(__dirname, '../template/app/source'), appName, ncpAllOption);
    //新建 app.yml
    await renderAndWriteTo(path.join(__dirname, '../template/app/config/app.js.mustache'), appName + "/app.yml", view);
    //application.yml 和 pom.xml 的生成渲染
    await renderAndWriteTo(path.join(__dirname, '../template/app/template/bom/pom.xml.mustache'),
        appName + "/bom/pom.xml", view);
    await renderAndWriteTo(path.join(__dirname, '../template/app/template/build-parent/pom.xml.mustache'),
        appName + "/build-parent/pom.xml", view);
    await renderAndWriteTo(path.join(__dirname, '../template/app/template/pom.xml.mustache'),
        appName + "/pom.xml", view);
    await renderAndWriteTo(path.join(__dirname, '../template/app/template/migration/pom.xml.mustache'),
        appName + "/migration/pom.xml", view);
    await renderAndWriteTo(path.join(__dirname, '../template/app/template/starter/pom.xml.mustache'),
        appName + "/starter/pom.xml", view);
    // await mkdir(appName + '/starter/api-starter/src/main/resources');
    await renderAndWriteTo(path.join(__dirname, '../template/app/template/starter/api-starter/src/main/resources/application.yml.mustache'),
        appName + "/starter/api-starter/src/main/resources/application.yml", view);
    // await mkdir(appName + '/starter/portal-starter/src/main/resources');
    await renderAndWriteTo(path.join(__dirname, '../template/app/template/starter/portal-starter/src/main/resources/application.yml.mustache'),
        appName + "/starter/portal-starter/src/main/resources/application.yml", view);
}

/**
 * 模板生成
 * @param {String} path 文件路径
 * @param {Object} view
 */
async function render(path, view = {}) {
    const response = await readFile(path);
    return Mustache.render(response.toString(), view);
}

/**
 * 加载应用插件
 * @param {String} appName 应用名称
 * @param {Object} answers 输入项
 */
async function loadAddons(appName, answers) {
    console.log('开始加载插件列表')
    const defaultRemote = _template("git@github.com:jimoos-cn/${ref}.git")
    const addonDir = appName + '/addons/depends';
    const addonCache = appName + "/.addonCache";
    await _forEach(values.addons, async element => {
        if (answers.Addons.indexOf(element.value) != -1) {
            if (element.SourceType == 'git') {
                if (element.Source) {
                    //如果有填写地址 则直接用 git 地址
                    await gitCloneOrPull(element.Source, addonCache, element.Ref);
                } else {
                    //如果不存在地址 则直接用默认地址
                    await gitCloneOrPull(defaultRemote({ref: element.Ref}), addonCache, element.Ref);
                }
            }
            goToAppParentDir();
            await copyAddon(element.value, element.Ref, appName + "/.addonCache/" + element.Ref + '/addons/@', addonDir, element.Group);
        }
    });
    console.log('加载插件列表' + colors.green('完成'))
}

async function copyAddon(value, ref, addonSrc, addonDist, group) {
    if (_endsWith(value, '*')) {
        //如果是 全部插件 则全部拷贝
        await ncpSync(addonSrc, addonDist, ncpAllOption);
    } else {
        let srcAddonPath = addonSrc + '/' + value;
        let distAddonPath = addonDist + '/' + value;
        if (group) {
            srcAddonPath = addonSrc + '/' + group + '/' + value;
            distAddonPath = addonDist + '/' + group + '/' + value;

            if (!fs.existsSync(addonDist + '/' + group)) {
                console.log("新建目录:%s", value);
                await mkdir(addonDist + '/' + group);
            }
        }

        //否则 则是拷贝 目标插件
        // let addonPath = addonSrc + '/' + value;
        console.log('正在加载Addon: %s at %s', value, srcAddonPath);
        if (fs.existsSync(srcAddonPath)) {
            await ncpSync(srcAddonPath, distAddonPath, ncpAllOption);
        } else {
            console.log('addon ' + colors.bold(value) + ' of source  ' + colors.bold(ref) + ' fetch ' + colors.red('failed'))
        }
    }
}

/**
 * 刷新 模块 pom.xml
 * @returns {Promise<void>}
 */
async function refreshAddonPom(appName) {
    //特殊的包名
    let realAppName = appName;
    const groups = ["spi", 'apps', 'base', 'thirdparty'];
    if (appName) {
        appName = appName + "/";
    } else {
        appName = '';
        //基础的验证配置
        const appSchema = new Schema({
            App: {
                Name: {
                    type: String,
                    required: true
                }
            }
        })

        if (fse.existsSync("app.yml")) {
            const doc = yamlUtil.loadYaml("app.yml")
            const errors = appSchema.validate(doc)
            if (errors && errors.length > 0) {
                console.error('app.yml has errors:' + errors)
                process.exit(1)
            } else {
                realAppName = doc.App.Name;
            }
        } else {
            console.error('app.yml is not exist on app')
            process.exit(1)
        }
    }
    const depends = appName + 'addons/depends';
    const inner = appName + 'addons/@';
    const dependAddons = await ls(depends);
    const innerAddons = await ls(inner);
    let addons = [];
    let innnerAddons = [];
    for (let addon of dependAddons) {
        if (addon.indexOf('readme') == -1 && addon) {
            if (groups.indexOf(addon) == -1) {
                addons.push({
                    name: addon
                })
            } else {
                //如果是子包名 则
                const innerGroups = await ls(depends + "/" + addon);
                for (let addon_y of innerGroups) {

                    if (addon_y.indexOf('readme.md') == -1) {
                        addons.push({
                            name: addon + "/" + addon_y
                        })
                    }
                }
            }
        }
    }
    for (let addon of innerAddons) {
        if (addon.indexOf('readme') == -1 && addon) {
            if (groups.indexOf(addon) == -1) {
                innnerAddons.push({
                    name: addon
                })
            } else {
                //如果是子包名 则
                const innerGroups = await ls(inner + "/" + addon);
                for (let addon_y of innerGroups) {
                    if (addon_y.indexOf('readme.md') == -1) {
                        innnerAddons.push({
                            name: addon + "/" + addon_y
                        })
                    }
                }
            }
        }
    }

    let view = {
        Addons: addons,
        InnerAddons: innnerAddons,
        Name: realAppName
    }

    console.log("Addons Pom  完成");
    //刷新 addons pom.xml
    await renderAndWriteTo(path.join(__dirname, '../template/app/template/addons/pom.xml.mustache'), appName + "addons/pom.xml", view);
}

/**
 * 重置文件目录 cursor
 * @returns
 */
function goToAppParentDir() {
    shellJs.cd(_addonDirAbsolutelyPath);
    shellJs.cd('..');
    shellJs.cd('..');
}

/**
 * 下载源代码 到 addons
 * @param {git地址} url
 */
let _addonDirAbsolutelyPath = '';

async function gitCloneOrPull(remote, addonCacheDir, addonRefName, pull) {
    if (!_endsWith(_addonDirAbsolutelyPath, '.addonCache')) {
        shellJs.cd(addonCacheDir);
        _addonDirAbsolutelyPath = shellJs.pwd().stdout;
    }
    if (!fse.existsSync(_addonDirAbsolutelyPath + '/' + addonRefName)) {
        shellJs.cd(_addonDirAbsolutelyPath);
        console.log('starting git clone  ' + colors.bold(remote) + ' ... ')
        if (shellJs.exec('git clone ' + remote).code !== 0) {
            console.log('addon  source ref' + colors.bold(addonRefName) + ' init ' + colors.red('failed'))
            shellJs.exit(1);
        } else {
            console.log('addon  source ref' + colors.bold(addonRefName) + ' init ' + colors.green('successful'))
        }
    } else {
        if (pull) {
            //如果需要更新 则 更新
            shellJs.cd(_addonDirAbsolutelyPath + '/' + addonRefName);
            console.log('starting git pull  ' + colors.bold(remote) + ' ... ')
            if (shellJs.exec('git pull').code == 0) {
                console.log('addon  source ref' + colors.bold(addonRefName) + ' update ' + colors.green('successful'))
            } else {
                console.log('addon  source ref' + colors.bold(addonRefName) + ' update ' + colors.red('failed'))
            }
        }
    }
}

module.exports.render = render;
module.exports.renderAndWriteTo = renderAndWriteTo;
module.exports.refreshAddonPom = refreshAddonPom;
module.exports.loadAddons = loadAddons;
module.exports.gitCloneOrPull = gitCloneOrPull;
module.exports.copyAddon = copyAddon;

