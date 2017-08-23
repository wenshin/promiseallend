'use strict';

function toStr(value) {
  return Object.prototype.toString.call(value);
}


/**
 * 并行执行多个 promise 实例。
 *
 * @feature
 *   1. 不同于 Promise.all 只要其中一个 promise 结束，就会丢弃所有数据；
 *   2. 支持以数组、对象形式传递 promise。
 *
 * @usage
 *
 *    promiseAllEnd(
 *      [Promise.resolve(1), Promise.resolve(2), Promise.reject('error')],
 *      {
 *        unhandledRejection() {}
 *      }
 *    )
 *      .then(data => {
 *        // do something with data `[1, 2]`
 *      })
 *      .catch(error => {
 *        // not run
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

  const errorStack = new Error().stack.replace('Error', '');
  const keys = Object.keys(promises);
  const result = {
    keys,
    errorsByKey: {},
    errorKeys: [],
    dataByKey: {},
    isAllRejected: false,
    isPromisesArray: promises instanceof Array,
    isPending: true,
    isRejected: false,
    rejectedKey: null
  };

  let count = 0;
  let promise = Promise.resolve(promises);

  if (keys.length) {
    promise = new Promise((resolve, reject) => {
      const _reject = (...args) => {
        result.isRejected = true;
        reject(...args);
      };

      keys.map( key => promises[key]
        .then(fullfiledWrap(key), rejectedWrap(key))
        .then(() => always(key, resolve, _reject))
      );
    });
  }

  return promise;

  function always(key, resolve, reject) {
    result.isPending = ++count < keys.length;
    result.errorKeys = Object.keys(result.errorsByKey);
    result.isAllRejected = result.errorKeys.length === keys.length;

    const requireConfig = options.requireConfig;
    const isRequire = requireConfig === true
      || (requireConfig
        && typeof requireConfig === 'object'
        && requireConfig[key]);

    if (isRequire && result.errorsByKey[key]) {
      result.rejectedKey = key;
      reject(newRjectedError(result, key));
    } else if (!result.isPending) {
      onPendingFinish(result, resolve, reject);
    }
  }

  function fullfiledWrap(key) {
    return datum => result.dataByKey[key] = datum;
  }

  function rejectedWrap(key) {
    return error => {
      if (error.detail) {
        result.errorsByKey[key] = error.detail;
      } else {
        result.errorsByKey[key] = error;
      }
    };
  }

  function onPendingFinish(result, resolve, reject) {
    const unhandledRejection = options.unhandledRejection
      || promiseAllEnd.unhandledRejection;
    if (result.isRejected) {
      _handleRestRejected();
    } else if (result.isAllRejected) {
      reject(newRjectedError(result));
    } else {
      const data = getDataOfResult(result, 'dataByKey');
      resolve(data);
      nextTick(_handleRestRejected);
    }

    function _handleRestRejected() {
      if (result.errorKeys.length && unhandledRejection) {
        for (const key of result.errorKeys) {
          key !== result.rejectedKey
            && unhandledRejection.call(
              promise,
              result.errorsByKey[key],
              result.isPromisesArray ? Number(key) : key
            );
        }
      }
    }
  }

  function newRjectedError(result, key) {
    let err;
    if (key) {
      err = result.errorsByKey[key];
      if (typeof err === 'string') {
        err = new Error(`promises[${key}] rejected (${err})`);
        err.stack = errorStack;
      } else if (err instanceof Error) {
        err.message = `promises[${key}] rejected (${err.message})`
        err.stack = errorStack + err.stack;
      } else {
        err = new Error(`promises[${key}] rejected`);
        err.stack = errorStack;
      }
    } else {
      err = new Error('all rejected');
      err.stack = errorStack;
      err.detail = getDataOfResult(result, 'errorsByKey');
    }
    err.stack = `promiseAllEndError: ${err.message}${err.stack}`;
    return err;
  }
}

function getDataOfResult(result, name) {
  return result.isPromisesArray
    ? result.keys.map(key => result[name][key])
    : result[name];
}

module.exports = promiseAllEnd;


function nextTick(cb) {
  if (typeof process === 'object') {
    process.nextTick(cb);
  } else {
    setTimeout(cb, 0);
  }
}
