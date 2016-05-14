'use strict';

/**
 * 多个 Promise 对象或数组合并为一个 Promise 实例。
 * @usage
 *
 *    promiseAllEnd([Promise.resolve(1), Promise.resolve(2)])
 *      .then((data, error) => {
 *        // do something with data [1, 2]
 *        if (error) return Promise.reject(error);
 *      })
 *      .catch(error => {
 *        // do something with error.errorsByKey
 *      })
 *
 * @param  {Object|Array}  promises
 * @return {Promise}       ret.then(function(data) {}).catch(Function(errorsByKey, dataByKey) {})
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

function decoratePromise(promise) {
  let oldThen = promise.then;

  promise.then = function(handleFullfilled, handleRejected) {
    let newHandleRejected = ({error, data}) => {
      data && handleFullfilled(data);
      return handleRejected ? handleRejected(error) : Promise.reject(error);
    }
    return oldThen.call(promise, handleFullfilled, newHandleRejected);
  };
  return promise;
}

module.exports = promiseAllEnd;
