'use strict';

const assert = require('assert');
const promiseAllEnd = require('../lib');

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
    const set = new Set();
    for (let promise of [promiseArr, promiseArrAllRequired, promiseObj, promiseObjAllRequired]) {
      promise
        .then(data => {
          records.push('then fulfilled');
          let excepted = Array.isArray(data) ? [1, 2] : {k1: 1, k2: 2};
          assert.deepEqual(data, excepted, `数据正确${data}`);
          _handleFinish(promise);
        }, () => {
          records.push('then rejected');
          _handleFinish(promise);
        })
        .catch(error => done(error))
    }

    function _handleFinish(promise) {
      set.add(promise);
      if (set.size === 4) {
        assert.deepEqual(records, new Array(4).fill('then fulfilled'), `不触发错误处理。${records}`);
        done();
      }
    }
  });

  it('promiseAllEnd(<Array, Object>, {requireConfig: true}) 和 Promise.all 行为一样', function (done) {
    let promiseArrAllRequired = promiseAllEnd([Promise.resolve(1), errorPromise, Promise.resolve(3)], {requireConfig: true});
    let promiseObjAllRequired = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise, k3: Promise.resolve(3)}, {requireConfig: true});
    let records = [];
    const set = new Set();

    for (let promise of [promiseArrAllRequired, promiseObjAllRequired]) {
      promise
        .then(() => {
          records.push('then fulfilled')
          _handleFinish(promise);
        }, error => {
          records.push('then rejected');
          const isArray = error.detail instanceof Array;
          const key = isArray ? '1' : 'k2';
          assert.ok(key, error.key);
          assert.deepEqual(error.detail, 'error', `错误详情正确，${error}`);
          assert.ok(!error.isAllRejected, `isAllRejected 应为 false，${error}`);
          _handleFinish(promise);
        })
        .catch(error => done(error));
    }

    function _handleFinish(promise) {
      set.add(promise);
      if (set.size === 2) {
        assert.deepEqual(records, new Array(2).fill('then rejected'), `事件正确响应。${records}`);
        done();
      }
    }
  });

  it('promiseAllEnd(<Array, Object>, {requireConfig: <Array, Object>}) requireConfig 为 true 的 promise 失败会处理为 rejected', function (done) {
    let promiseArr = promiseAllEnd([Promise.resolve(1), errorPromise], {requireConfig: [true, false]});
    let promiseArrRequired = promiseAllEnd([Promise.resolve(1), errorPromise], {requireConfig: [false, true]});
    let promiseObj = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise}, {requireConfig: {k1: true, k2: false}});
    let promiseObjRequired = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise}, {requireConfig: {k1: false, k2: true}});

    let records = [];
    const set = new Set();
    for (let promise of [promiseArr, promiseArrRequired, promiseObj, promiseObjRequired]) {
      promise
        .then(data => {
          let excepted = Array.isArray(data) ? [1, undefined] : {k1: 1};
          records.push('then fulfilled');
          assert.deepEqual(data, excepted, `忽略非必须的 promise 错误，${data}`);
          _handleFinish(promise);
        }, (error) => {
          records.push('then rejected');
          _handleFinish(promise);
        })
        .catch(error => done(error));
    }

    function _handleFinish(promise) {
      set.add(promise);
      if (set.size === 4) {
        assert.deepEqual(records, [
          'then fulfilled', 'then rejected',
          'then fulfilled', 'then rejected'
        ], `事件正确响应。${records}`);
        done();
      }
    }
  });

  it('promiseAllEnd(<Array, Object>, {requireConfig: false}) 只有当所有 promise 都失败后才会才会处理成 rejected', function (done) {
    let promiseArr = promiseAllEnd([Promise.resolve(1), errorPromise]);
    let promiseArrFalse = promiseAllEnd([Promise.resolve(1), errorPromise], {requireConfig: false});
    let promiseArrAllRejected = promiseAllEnd([errorPromise, errorPromise]);
    let promiseObj = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise});
    let promiseObjFalse = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise}, {requireConfig: false});
    let promiseObjAllRejected = promiseAllEnd({k1: errorPromise, k2: errorPromise});
    let records = [];
    const set = new Set();

    for (let promise of [
      promiseArr, promiseArrFalse, promiseArrAllRejected,
      promiseObj, promiseObjFalse, promiseObjAllRejected
    ]) {
      promise
        .then(data => {
          let excepted = Array.isArray(data) ? [1, undefined] : {k1: 1};
          records.push('then fulfilled');
          assert.deepEqual(data, excepted, `忽略非必须的 promise 错误，${data}`);
          _handleFinish(promise);
        }, error => {
          let detail = Array.isArray(error.detail) ? ['error', 'error'] : {k1: 'error', k2: 'error'};
          records.push('then rejected');
          assert.deepEqual(error.detail, detail, `错误详情正确，${error}`);
          assert.ok(!error.isAllRejected, `isAllRejected 应为 false，${error}`);
          _handleFinish(promise);
        })
        .catch(error => done(error));
    }

    function _handleFinish(promise) {
      set.add(promise);
      if (set.size === 6) {
        assert.deepEqual(records, [
          'then fulfilled', 'then fulfilled', 'then rejected',
          'then fulfilled', 'then fulfilled', 'then rejected'
        ], `事件正确响应。${records}`);
        done();
      }
    }
  });

  it('promiseAllEnd(<Array, Object>, {unhandledRejection})', function (done) {
    let promiseArr = promiseAllEnd([errorPromise, Promise.resolve(1), errorPromise], {
      unhandledRejection(error, key) {
        assert.ok(typeof key === 'number', typeof key);
        _handleFinish(error, key);
      }
    });
    let promiseObj = promiseAllEnd({k1: Promise.resolve(1), k2: errorPromise}, {
      unhandledRejection(error, key) {
        assert.ok(typeof key === 'string', typeof key);
        _handleFinish(error, key);
      }
    });

    let records = [];
    const errorsByKey = {};
    const set = new Set();
    for (let promise of [promiseArr, promiseObj]) {
      promise
        .then(data => {
          let excepted = Array.isArray(data) ? [undefined, 1, undefined] : {k1: 1};
          records.push('then fulfilled');
          assert.deepEqual(data, excepted, `忽略非必须的 promise 错误，${data}`);
        }, () => {
          records.push('then rejected');
        })
        .catch(error => done(error));
    }

    function _handleFinish(error, key) {
      set.add(key);
      errorsByKey[key] = error;
      if (set.size === 3) {
        assert.deepEqual(errorsByKey, {0: 'error', 2: 'error', k2: 'error'});
        assert.deepEqual(records, ['then fulfilled', 'then fulfilled'], `事件正确响应。${records}`);
        done();
      }
    }
  });

  it('promiseAllEnd(promises, {requireConfig}) requireConfig if not boolean must be same with promises type', function () {
    assert.throws(function () {
      promiseAllEnd([], {requireConfig: {}});
    }, Error);

    assert.throws(function () {
      promiseAllEnd({}, {requireConfig: []});
    }, Error);
  });

  it('promiseAllEnd(promises, {unhandledRejection}) unhandledRejection must be a function', function () {
    assert.throws(function () {
      promiseAllEnd([], {unhandledRejection: {}});
    }, Error);
  });

  it('promiseAllEnd([nestPromiseAllEnd]) will nest error info', function (done) {
    const promise1 = promiseAllEnd({k1: errorPromise, k2: errorPromise});
    const promise2 = promiseAllEnd({j1: promise1, j2: errorPromise});
    promise2
      .catch(error => {
        assert.deepEqual(error.detail, {j1: {k1: 'error', k2: 'error'}, j2: 'error'}, error);
        done();
      })
  });
});
