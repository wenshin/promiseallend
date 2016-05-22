'use strict';

const PromisesRejectedError = require('./errors').PromisesRejectedError;

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
  const result = {
    keys,
    errorsByKey: {},
    errorKeys: [],
    dataByKey: {},
    isAllRejected: false,
    isPromisesArray: promises instanceof Array,
    isPending: true,
    isSettled: false
  };

  let count = 0;
  let _pendingFinishCallback;

  let promise = new Promise((resolve, reject) => {
    keys.map( key => promises[key]
      .then(fullfiledWrap(key), rejectedWrap(key))
      .then(() => settle(resolve, reject))
    );
  });

  promise.onPendingFinish = callback => {
    _pendingFinishCallback = callback;
    promise.onPendingFinish = () => {
      throw new Error('`onPendingFinish` can only been register once after `promiseAllEnd` called');
    }
    return promise;
  };

  return promise;

  // 主逻辑已经结束，以下为内部函数
  function settle(resolve, reject) {
    result.isPending = ++count < keys.length;
    result.errorKeys = Object.keys(result.errorsByKey);
    result.isAllRejected = result.errorKeys.length === keys.length;
    let isSettled = !result.isPending;

    if (result.isPending && result.errorKeys.length) {
      isSettled = settlePending(result, requireConfig, reject);
    } else if (!result.isPending) {
      settleFinished(result, resolve, reject);
    }

    isSettled
      && _pendingFinishCallback instanceof Function
      && _pendingFinishCallback({
        data: getDataOfResult('dataByKey'),
        errors: result.errorKeys.length ? getDataOfResult(result, 'errorsByKey') : null
      });
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
}

function settlePending(result, requireConfig, reject) {
  const requiredError = newPromiseError('required promise rejected', result);
  if (requireConfig === true) {
    reject(requiredError);
    return true;
  } else if (typeof requireConfig === 'object') {
    let isRequiredRejected = !!result.errorKeys.find(key => requireConfig[key]);
    if (isRequiredRejected) {
      reject(requiredError);
      return true;
    }
  }
  return false;
}

function settleFinished(result, resolve, reject) {
  let data = getDataOfResult(result, 'dataByKey');
  // 全部出错
  if (result.isAllRejected) {
    reject(newPromiseError('all promises rejected', result));
  } else {
    resolve(data);
  }
}

function newPromiseError(message, result) {
  let detail = getDataOfResult(result, 'errorsByKey');
  return new PromisesRejectedError(message, detail, result.errorKeys);
}

function getDataOfResult(result, name) {
  return result.isPromisesArray
    ? result.keys.map(key => result[name][key])
    : result[name];
}

module.exports = promiseAllEnd;
