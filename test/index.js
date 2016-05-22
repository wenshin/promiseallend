'use strict';

const assert = require('assert');
const promiseAllEnd = require('../lib');

const PROMISE_DELAY = 5;
const ERR_RESULT = 'error';
const errorPromise = Promise.reject(ERR_RESULT);

/**
 * Test Cases
 * - promiseAllEnd([], true).then(f, r)  // the same to Promise.all
 * - promiseAllEnd([], false).then(f, r)  // 部分成功优先响应 fulfilled 方法
 * - promiseAllEnd([], [true, false]).then(f)
 * - promiseAllEnd().then(f, r)  // 部分错误时只响应 fulfilled 方法
 * - promiseAllEnd().then(f).catch(r) // 同上
 * - promiseAllEnd().then(null, r) // 捕捉所有错误
 * - promiseAllEnd().catch(r) // 捕捉所有错误
 */

describe('', function () {
  it('输入为全部成功的 promise，应该返回数据，且没有错误', function (done) {
    let promiseArr = promiseAllEnd([Promise.resolve(1), Promise.resolve(2)]);
    let promiseArrAllRequired = promiseAllEnd([Promise.resolve(1), Promise.resolve(2)], true);
    let promiseObj = promiseAllEnd({k1: Promise.resolve(1), k2: Promise.resolve(2)});
    let promiseObjAllRequired = promiseAllEnd({k1: Promise.resolve(1), k2: Promise.resolve(2)}, true);

    let records = [];
    for (let promise of [promiseArr, promiseArrAllRequired, promiseObj, promiseObjAllRequired]) {
      promise
        .then(data => {
          let excepted = Array.isArray(data) ? [1, 2] : {k1: 1, k2: 2};
          records.push('then fulfilled');
          assert.deepEqual(data, excepted, `数据正确${data}`);
        }, () => {
          records.push('then rejected');
        })
        .catch(error => {
          records.push('catch rejected', error);
        })
    }

    setTimeout(() => {
      assert.deepEqual(records, new Array(4).fill('then fulfilled'), `不触发错误处理。${records}`);
      done();
    }, PROMISE_DELAY)
  });

  it('promiseAllEnd(<Array, Object>, true) 和 Promise.all 行为一样', function (done) {
    let promiseArrAllRequired = promiseAllEnd([Promise.resolve(1), errorPromise, Promise.resolve(3)], true);
    let promiseObjAllRequired = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise, k3: Promise.resolve(3)}, true);
    let records = [];
    for (let promise of [promiseArrAllRequired, promiseObjAllRequired]) {
      promise
        .then(() => {
          records.push('then fulfilled')
        }, error => {
          let detail = Array.isArray(error.detail) ? [undefined, 'error', undefined] : {k2: 'error'};
          records.push('then rejected');
          assert.deepEqual(error.detail, detail, `错误详情正确，${error}`);
          assert.ok(!error.isAllRejected, `isAllRejected 应为 false，${error}`);
        })
        .catch(error => {
          records.push('catch rejected', error);
        });
    }

    setTimeout(() => {
      assert.deepEqual(records, new Array(2).fill('then rejected'), `事件正确响应。${records}`);
      done();
    }, PROMISE_DELAY)
  });

  it('promiseAllEnd(<Array, Object>, <Array, Object>) require 为 true 的 promise 失败会处理为 rejected', function (done) {
    let promiseArr = promiseAllEnd([Promise.resolve(1), errorPromise], [true, false]);
    let promiseArrRequired = promiseAllEnd([Promise.resolve(1), errorPromise], [false, true]);
    let promiseObj = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise}, {k1: true, k2: false});
    let promiseObjRequired = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise}, {k1: false, k2: true});
    let records = [];
    for (let promise of [promiseArr, promiseArrRequired, promiseObj, promiseObjRequired]) {
      promise
        .then(data => {
          let excepted = Array.isArray(data) ? [1, undefined] : {k1: 1};
          records.push('then fulfilled');
          assert.deepEqual(data, excepted, `忽略非必须的 promise 错误，${data}`);
        }, error => {
          let detail = Array.isArray(error.detail) ? [undefined, 'error'] : {k2: 'error'};
          records.push('then rejected');
          assert.deepEqual(error.detail, detail, `错误详情正确，${error}`);
          assert.ok(!error.isAllRejected, `isAllRejected 应为 false，${error}`);
        })
        .catch(error => {
          records.push('catch rejected', error);
        });
    }

    setTimeout(() => {
      assert.deepEqual(records,
        ['then fulfilled', 'then rejected', 'then fulfilled', 'then rejected'],
        `事件正确响应。${records}`);
      done();
    }, PROMISE_DELAY)
  });

  it('promiseAllEnd(<Array, Object>, <undefined, false>) 只有当所有 promise 都失败后才会才会处理成 rejected', function (done) {
    let promiseArr = promiseAllEnd([Promise.resolve(1), errorPromise]);
    let promiseArrFalse = promiseAllEnd([Promise.resolve(1), errorPromise], false);
    let promiseArrAllRejected = promiseAllEnd([errorPromise, errorPromise]);
    let promiseObj = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise});
    let promiseObjFalse = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise}, false);
    let promiseObjAllRejected = promiseAllEnd({k1: errorPromise, k2: errorPromise});
    let records = [];
    for (let promise of [
      promiseArr, promiseArrFalse, promiseArrAllRejected,
      promiseObj, promiseObjFalse, promiseObjAllRejected
    ]) {
      promise
        .then(data => {
          let excepted = Array.isArray(data) ? [1, undefined] : {k1: 1};
          records.push('then fulfilled');
          assert.deepEqual(data, excepted, `忽略非必须的 promise 错误，${data}`);
        }, error => {
          let detail = Array.isArray(error.detail) ? ['error', 'error'] : {k1: 'error', k2: 'error'};
          records.push('then rejected');
          assert.deepEqual(error.detail, detail, `错误详情正确，${error}`);
          assert.ok(!error.isAllRejected, `isAllRejected 应为 false，${error}`);
        })
        .catch(error => {
          records.push('catch rejected', error);
        });
    }

    setTimeout(() => {
      assert.deepEqual(records, [
        'then fulfilled', 'then fulfilled', 'then rejected',
        'then fulfilled', 'then fulfilled', 'then rejected'
      ], `事件正确响应。${records}`);
      done();
    }, PROMISE_DELAY)
  });

  it('promiseAllEnd(<Array, Object>, <undefined, false>).onPendingFinish()', function (done) {
    let promiseArr = promiseAllEnd([Promise.resolve(1), errorPromise]);
    let promiseObj = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise});
    let records = [];
    for (let promise of [promiseArr, promiseObj]) {
      promise
        .onPendingFinish(({errors}) => {
          let detail = Array.isArray(errors) ? [undefined, 'error'] : {k2: 'error'};
          records.push('onPendingFinish');
          assert.deepEqual(errors, detail, `获得忽略的 promise 错误，${errors}`);
        })
        .then(data => {
          let excepted = Array.isArray(data) ? [1, undefined] : {k1: 1};
          records.push('then fulfilled');
          assert.deepEqual(data, excepted, `忽略非必须的 promise 错误，${data}`);
        }, error => {
          let detail = Array.isArray(error.detail) ? ['error', 'error'] : {k1: 'error', k2: 'error'};
          records.push('then rejected');
          assert.deepEqual(error.detail, detail, `错误详情正确，${error}`);
          assert.ok(!error.isAllRejected, `isAllRejected 应为 false，${error}`);
        })
        .catch(error => {
          records.push('catch rejected', error)
        });
    }

    setTimeout(() => {
      assert.deepEqual(records,
        ['onPendingFinish', 'onPendingFinish', 'then fulfilled', 'then fulfilled'],
        `事件正确响应。${records}`);
      done();
    }, PROMISE_DELAY)
  });

});
