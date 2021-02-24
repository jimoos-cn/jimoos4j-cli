/*
 * 原生forEach 异步问题 的解决办法
 * @see https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
 * @Author: qisheng.chen 
 * @Date: 2020-02-16 20:49:07 
 * @Last Modified by: qisheng.chen
 * @Last Modified time: 2020-02-16 20:50:12
 */
module.exports = async function (array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}