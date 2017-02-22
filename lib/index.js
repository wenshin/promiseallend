'use strict';

function toStr(value) {
  return Object.prototype.toString.call(value);
}


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
 * @param  {Object}                Optional
 * @param  {Boolean|Object|Array}  options.requireConfig
 * **Boolean**: default type and default value is false.
 *              if `true` will run like Promise.all.
 * **Object|Array**: the type must be same with `promises`.
 *                   eg. `promises=[promise1, promise2, promise3]`
 *                   and `requireConfig=[true, false, false]`,
 *                   if the promise1 fail all will fail.
 * @param  {Function}              options.unhandledRejection
 * A function to handle all unhandledRejection errors.
 * The only one argument has same type with promises
 *
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
function promiseAllEnd(promises, options = {}) {
  if (options.unhandledRejection && typeof options.unhandledRejection !== 'function') {
    throw new Error('promiseAllEnd(promises, options), options.unhandledRejection must be a function');
  }

  if (options.requireConfig
    && typeof options.requireConfig !== 'boolean'
    && toStr(options.requireConfig) !== toStr(promises)
  ) {
    throw new Error('promiseAllEnd(promises, options), options.requireConfig if not boolean, then the type must the same with promises');
  }

  const keys = Object.keys(promises);
  const result = {
    keys,
    errorsByKey: {},
    errorKeys: [],
    dataByKey: {},
    isAllRejected: false,
    isPromisesArray: promises instanceof Array,
    isPending: true,
    isRejected: false
  };

  let count = 0;

  let promise = new Promise((resolve, reject) => {
    const _reject = (...args) => {
      result.isRejected = true;
      reject(...args);
    };

    keys.map( key => promises[key]
      .then(fullfiledWrap(key), rejectedWrap(key))
      .then(() => always(key, resolve, _reject))
    );
  });

  return promise;

  function always(key, resolve, reject) {
    result.isPending = ++count < keys.length;
    result.errorKeys = Object.keys(result.errorsByKey);
    result.isAllRejected = result.errorKeys.length === keys.length;

    if (result.isRejected) return;

    if (result.isPending && result.errorKeys.length) {
      onPendingError(key, result, reject);
    } else if (!result.isPending) {
      onPendingFinish(result, resolve, reject);
    }
  }

  function fullfiledWrap(key) {
    return datum => result.dataByKey[key] = datum;
  }

  function rejectedWrap(key) {
    return error => {
      if (error.errorsByKey) {
        result.errorsByKey[key] = error.detail;
      } else {
        result.errorsByKey[key] = error;
      }
    };
  }

  function onPendingError(key, result, reject) {
    const requireConfig = options.requireConfig;

    if (requireConfig === true
      || (
        requireConfig && typeof requireConfig === 'object' && requireConfig[key]
      )
    ) {
      reject(newRjectedError(result));
    }
  }

  function onPendingFinish(result, resolve, reject) {
    const unhandledRejection = options.unhandledRejection;
    if (result.isAllRejected) {
      reject(newRjectedError(result));
    } else {
      const data = getDataOfResult(result, 'dataByKey');
      resolve(data);
      if (result.errorKeys.length && unhandledRejection) {
        process.nextTick(() => {
          unhandledRejection.call(promise, newRjectedError(result));
        });
      }
    }
  }
}

function newRjectedError(result) {
  let err = new Error(`promiseAllEnd rejected ${result.errorKeys}`);
  err.detail = getDataOfResult(result, 'errorsByKey');
  return err;
}

function getDataOfResult(result, name) {
  return result.isPromisesArray
    ? result.keys.map(key => result[name][key])
    : result[name];
}

module.exports = promiseAllEnd;
