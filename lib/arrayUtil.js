/*
 * Set 集合操作
 * @see https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Set
 * @Author: qisheng.chen 
 * @Date: 2020-02-11 11:37:07 
 * @Last Modified by: qisheng.chen
 * @Last Modified time: 2020-02-11 11:37:31
 */

var arrayUtil = {
    isSuperset: function (set, subset) {
        for (let elem of subset) {
            if (!set.has(elem)) {
                return false;
            }
        }
        return true;
    },

    union: function (setA, setB) {
        let _union = new Set(setA);
        for (let elem of setB) {
            _union.add(elem);
        }
        return _union;
    },

    intersection: function (setA, setB) {
        let _intersection = new Set();
        for (let elem of setB) {
            if (setA.has(elem)) {
                _intersection.add(elem);
            }
        }
        return _intersection;
    },
    symmetricDifference: function (setA, setB) {
        let _difference = new Set(setA);
        for (let elem of setB) {
            if (_difference.has(elem)) {
                _difference.delete(elem);
            } else {
                _difference.add(elem);
            }
        }
        return _difference;
    },
    difference: function (setA, setB) {
        let _difference = new Set(setA);
        for (let elem of setB) {
            _difference.delete(elem);
        }
        return _difference;
    }
}
module.exports = arrayUtil;