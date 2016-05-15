'use strict';

const promiseThen = Promise.prototype.then;

/**
 * 并行执行多个 promise 实例。
 *
 * @feature
 *   1. 不同于 Promise.all 只要其中一个 promise 结束，就会丢弃所有数据。
 *      promiseAllEnd 会在有部分错误和成功的情况下既响应 fullfilled，也响应 rejected；
 *   2. 支持以数组、对象形式传递 promise。
 *
 * @usage
 *
 *    promiseAllEnd([Promise.resolve(1), Promise.resolve(2), Promise.reject('error')])
 *      .then(data => {
 *        // do something with data `[1, 2]`
 *      })
 *      .catch(error => {
 *        // do something with error.errorsByKey `{2: 'error'}``
 *      })
 *
 * 更多见测试文件
 *
 * @param  {Object|Array}  promises
 * @return {Promise}
 */
function promiseAllEnd(promises) {
  let isArray = promises instanceof Array;
  let keys = Object.keys(promises);

  let newPromise =  new Promise((resolve, reject) => {
    let finishCount = 0;
    let sum = keys.length;
    let result = {
      errorsByKey: {},
      dataByKey: {}
    };

    function always() {
      // 还没有结束
      if (++finishCount < sum) return;

      // 结束所有的 promise
      let error;
      let errorKeys = Object.keys(result.errorsByKey);
      let dataKeys = Object.keys(result.dataByKey);
      let data = isArray
        ? Object.keys(keys).map(key => result.dataByKey[key])
        : result.dataByKey;

      // 全部出错或部分出错
      if (errorKeys.length) {
        error = new Error('promise failed in promiseAllEnd');
        error.errorsByKey = result.errorsByKey;
        reject({error, data: dataKeys.length ? data : null});
      // 没有出错
      } else {
        resolve(data);
      }
    }

    function fullfiledWrap(key) {
      return datum => {
        result.dataByKey[key] = datum;
        always();
      }
    }

    function rejectedWrap(key) {
      return error => {
        if (error.errorsByKey) {
          result.errorsByKey[key] = error.errorsByKey;
        } else {
          result.errorsByKey[key] = error;
        }
        always();
      };
    }

    keys.map( key => promises[key].then(fullfiledWrap(key), rejectedWrap(key)) );
  });

  return decoratePromise(newPromise);
}

/**
 * promiseAllEnd reject 的是混合值类型 {error, data}。
 * 通过 decoreatePromise 后，将把混合值类型分开。
 * PS. Promise.prototype.catch 其实是直接调用的 Promise.prototype.then 所以只需要处理 then 方法即可
 * @param  {Promise} promise 修饰前的 Promise 对象
 * @return {Promise}         修饰后的 Promise 对象
 */
function decoratePromise(promise) {
  promise.then = function (handleFullfilled, handleRejected) {
    let handleRejectedDecorated = decorateThenRejected(handleFullfilled, handleRejected);
    let nextPromise = promiseThen.call(promise, handleFullfilled, handleRejectedDecorated);
    // handleRejected 不存在时，会继续 reject 混合值，所以 promise 需要 decoreatePromise 修饰
    return handleRejected ? nextPromise : decoratePromise(nextPromise)
  };
  return promise;
}

function decorateThenRejected(handleFullfilled, handleRejected) {
  return !handleRejected
    ? function ({error, data}) {
        let rejectValueMix = {error};
        rejectValueMix.data = callFullfilled(handleFullfilled, data);
        return Promise.reject(rejectValueMix);
      }
    : function ({error, data}) {
        callFullfilled(handleFullfilled, data);
        return handleRejected(error);
      }
}

function callFullfilled(handleFullfilled, data) {
  // 如果有注册了 fullfilled 事件，则计算新的 data 并传递
  return data && handleFullfilled && handleFullfilled(data);
}

module.exports = promiseAllEnd;
