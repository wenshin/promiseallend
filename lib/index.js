'use strict';

const PromisesRejectedError = require('./errors').PromisesRejectedError;

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
 * @param  {Object|Array}          promises
 * @param  {Boolean|Object|Array}  requireConfig
 * config which promise must required.
 * if `true` means all promises will required, the action is the same to `Promise.all`.
 *
 * if `false` means not every promise is required,
 * so when some but not all promises rejected will been settled as `Fulfilled`.
 * but can register `onPendingFinish` event to handle the error and return a new promise.
 *
 * if `[true, false]` or `{key1: true, key2: false}` will settled as `Rejected`
 * when the required promise or all promises rejected
 *
 * @return {Promise}
 */
function promiseAllEnd(promises, requireConfig=false) {
  const keys = Object.keys(promises);

  let newPromise =  new Promise((resolve, reject) => {
    const result = {
      keys,
      errorsByKey: {},
      errorKeys: [],
      dataByKey: {},
      isAllRejected: false,
      isPromisesArray: promises instanceof Array,
      isPending: true
    };
    let count = 0;

    function settle() {
      result.isPending = ++count < keys.length;
      result.errorKeys = Object.keys(result.errorsByKey);
      result.isAllRejected = result.errorKeys.length === keys.length;
      // no promise rejected and not all promises finished, then continue
      if (!result.errorKeys.length && result.isPending) return;
      if (result.isPending) {
        settlePending(result, requireConfig, reject);
      } else {
        settleFinished(result, resolve, reject);
      }
    }

    function fullfiledWrap(key) {
      return datum => result.dataByKey[key] = datum;
    }

    function rejectedWrap(key) {
      return error => {
        if (error.errorsByKey) {
          result.errorsByKey[key] = error.errorsByKey;
        } else {
          result.errorsByKey[key] = error;
        }
      };
    }

    keys.map( key => promises[key]
      .then(fullfiledWrap(key), rejectedWrap(key))
      .then(settle)
    );
  });

  return newPromise;
}

function settlePending(result, requireConfig, reject) {
  const requiredError = newPromiseError('required promise rejected', result);
  if (requireConfig === true) {
    reject(requiredError);
  } else if (typeof requireConfig === 'object') {
    let isRequiredRejected = !!result.errorKeys.find(key => requireConfig[key]);
    if (isRequiredRejected) reject(requiredError);
  }
}

function settleFinished(result, resolve, reject) {
  // all promises settled
  let data = result.isPromisesArray
    ? result.keys.map(key => result.dataByKey[key])
    : result.dataByKey;

  // 全部出错
  if (result.isAllRejected) {
    reject(newPromiseError('all promises rejected', result));
  } else {
    resolve(data);
  }
}

function newPromiseError(message, result) {
  return new PromisesRejectedError(message, result.errorsByKey, result.isAllRejected);
}

function isUndefined(value) {
  return typeof value === 'undefined';
}

module.exports = promiseAllEnd;
