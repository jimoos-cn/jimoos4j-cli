/*
 * 添加内部插件命令支持
 * @Author: qisheng.chen
 * @Date: 2020-02-16 18:05:37
 * @Last Modified by: qisheng.chen
 * @Last Modified time: 2020-02-17 15:22:14
 */
const inquirer = require('inquirer');
const colors = require('colors');
const pad = require('pad');
const values = require('../lib/values');
const validApp = require('../lib/install').validApp;
const {render, renderAndWriteTo, refreshAddonPom} = require('../lib/init');
const {ncpSync} = require('../lib/fsTool');

const fs = require('fs');
const path = require('path');
const util = require('util');

const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);

let ncpAddonOption = {
    filter: function (file) {
        return true;
    }
}

const questions = [
    {type: 'input', name: 'Name', message: '插件名称(请输入英文)'},
    {type: 'list', name: 'Type', message: '插件类别', choices: values.typesPlain},
    {type: 'list', name: 'Group', message: '分组', choices: values.groupsPlain},
    {type: 'input', name: 'Description', message: '应用描述'},
    {type: 'checkbox', name: 'DependOns', message: '选择依赖插件', choices: values.addons}
];

module.exports = async function () {
    let doc = validApp();
    inquirer
        .prompt(questions)
        .then(async function (answers) {
            console.log('插件配置如下');
            console.log('------------------');

            console.log(pad(colors.grey('插件名称: '), 30), answers.Name);
            console.log(pad(colors.grey('插件类型: '), 30), answers.Type);
            console.log(pad(colors.grey('分组: '), 30), answers.Group);
            console.log(pad(colors.grey('应用描述: '), 30), answers.Description);
            console.log(pad(colors.grey('依赖插件: '), 30), answers.DependOns);
            console.log('------------------');
            try {
                await mkAddonDir(answers);
                await mkAddon(answers, doc.App.Name);
                await refreshAddonPom();
                console.log('插件 %s', colors.bold(answers.Name) + ' 初始化' + colors.green('完成'))
            } catch (error) {
                console.error(error);
            }
        });
}

async function mkAddonDir(answers) {
    console.log('%s %s', colors.grey('新建插件文件: '), colors.bold(answers.Name))
    if (answers.Group) {
        await mkdir('addons/@/' + answers.Group + '/' + answers.Name);
    } else {
        await mkdir('addons/@/' + answers.Name);
    }
}

async function mkAddon(answers, appName) {
    const view = {
        Name: answers.Name,
        REF: appName,
        Type: answers.Type,
        Group: answers.Group,
        Description: answers.Description,
        Name: answers.Name,
        SourceType: 'git',
        Source: '',
        Type: answers.Type,
        DependOns: answers.DependOns ? answers.DependOns.join(',') : ''
    }

    let addonDir = answers.Name;
    if (answers.Group) {
        addonDir = answers.Group + '/' + answers.Name;
    }
    await ncpSync(path.join(__dirname, '../template/addon/source'), 'addons/@/' + addonDir, ncpAddonOption);
    //新建 addon.yml
    const addonYmlRes = await render(path.join(__dirname, '../template/addon/config/addon.yml.mustache'), view);
    await writeFile('addons/@/' + addonDir + '/addon.yml', addonYmlRes);

    await renderAndWriteTo(path.join(__dirname, '../template/addon/template/readme.md.mustache'),
        'addons/@/' + addonDir + "/readme.md", view);
    await renderAndWriteTo(path.join(__dirname, '../template/addon/template/pom.xml.mustache'),
        'addons/@/' + addonDir + "/pom.xml", view);
}
