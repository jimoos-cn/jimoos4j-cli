#!/usr/bin/env node

/*
 * QSAE 打包工具类
 * @Author: qisheng.chen
 * @Date: 2020-01-28 17:34:11
 * @Last Modified by: qisheng.chen
 * @Last Modified time: 2020-02-17 14:56:45
 */
//commander
const program = require('commander');
const init = require('../lib/init');
const update = require('../lib/install').update;
const addAddon = require('../lib/addAddon');


//初始化 空项目结构
program
    .command('init app project')
    .description('init app project')
    .action(function () {
        init()
    })

//初始化 空插件结构
program
    .command('add-addon in app')
    .description('init app inner addon')
    .action(function () {
        addAddon()
    })
//更新 应用插件
program
    .command('sync app addons')
    .option('-d, --deleteOrigin', 'Delete Origin Sync Code')
    .option('-o, --object <object>', "Update Destination Object")
    .description('update addons')
    .action(function (options) {
        console.log("object:" + options.object)
        update(options)
    })
program.parse(process.argv);


