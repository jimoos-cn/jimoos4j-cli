/*
 * 构建项目
 * @Author: qisheng.chen
 * @Date: 2020-02-13 10:59:34
 * @Last Modified by: qisheng.chen
 * @Last Modified time: 2020-02-19 17:12:23
 */
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const ncp = require('ncp').ncp;

ncp.limit = 1024;

/**
 * ncp promisify
 * @param {String} src 源地址
 * @param {String} dest 目标地址
 * @param { Object} ncpOptions 配置选项
 */
let ncpSync = function (src, dest, ncpOptions) {
    return new Promise((resolve, reject) => {
        if (ncpOptions) {
            ncp(src, dest, ncpOptions, (err) => {
                if (err) {
                    console.error('Error while copying folder contents.', err);
                    reject(err);
                    return;
                }
                resolve();
            })
        } else {
            ncp(src, dest, (err) => {
                if (err) {
                    console.error('Error while copying folder contents.', err);
                    reject(err);
                    return;
                }
                resolve();
            })
        }
    })
}

/**
 * 查询目录下 子文件
 * @param {String} path 路径
 */
async function ls(path) {
    let names = await readdir(path)
    return names;
}

module.exports.ncpSync = ncpSync;
module.exports.ls = ls;
