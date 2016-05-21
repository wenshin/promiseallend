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
    let promiseArr = promiseAllEnd([Promise.resolve(1), Promise.resolve(2)])
    let promiseArrAllRequired = promiseAllEnd([Promise.resolve(1), Promise.resolve(2)], true)
    let promiseObj = promiseAllEnd({k1: Promise.resolve(1), k2: Promise.resolve(2)})
    let promiseObjAllRequired = promiseAllEnd({k1: Promise.resolve(1), k2: Promise.resolve(2)}, true)

    let records = [];
    for (let promise of [promiseArr, promiseArrAllRequired, promiseObj, promiseObjAllRequired]) {
      promise
        .then(data => {
          let excepted = Array.isArray(data) ? [1, 2] : {k1: 1, k2: 2};
          assert.deepEqual(data, excepted, `数据正确${data}`)
          records.push('then fulfilled');
        }, () => {
          records.push('then rejected');
        })
        .catch(() => {
          records.push('catch rejected');
        })
    }

    setTimeout(() => {
      assert.deepEqual(records, new Array(4).fill('then fulfilled'), `不触发错误处理。${records}`);
      done();
    }, PROMISE_DELAY)
  });

  // it('promiseAllEnd([], true).then(f, r) 和 Promise.all 行为一样', function (done) {
  //   let data;
  //   let error;
  //   promiseAllEnd(
  //     [Promise.resolve(1), errorPromise, Promise.resolve(3)],
  //     [false, true, false]
  //   )
  //     .then(_data => data = _data)
  //     .catch(_error => error = _error);

  //   setTimeout(() => {
  //     assert.deepEqual(data, [1, undefined, 3], `不成功数据为 undefined。${data}`);
  //     assert.ok(!error, '错误被忽略')
  //     done();
  //   }, PROMISE_DELAY)
  // });

  // it('promiseAllEnd([], false).then(f, r)，注册 onPendingChange 事件，则以 onPendingChange 的返回值作为新的 promise', function (done) {
  //   let data;
  //   let error1;
  //   let error2;
  //   promiseAllEnd([Promise.resolve(1), errorPromise, Promise.resolve(3)])
  //     .onPendingChange((_data, _error) => {
  //       error1 = _error;
  //       return _data;
  //     })
  //     .then(_data => data = _data)
  //     .catch(_error => error2 = _error);

  //   setTimeout(() => {
  //     assert.deepEqual(data, [1, undefined, 3], `部分成功，不成功数据为 undefined。${data}`);
  //     assert.ok(error1, '在 onPendingChange 中获得 error')
  //     assert.ok(!error2, '在后续的 catch 中不捕捉错误')
  //     done();
  //   }, PROMISE_DELAY)
  // });

  // it('输入为全部成功的 promise 对象，应该返回对象数据，且没有错误', function (done) {
  //   let data;
  //   let error;
  //   let error1;
  //   promiseAllEnd({key1: Promise.resolve(1), key2: Promise.resolve(2)})
  //     .then(_data => data = _data, () => error = true)
  //     .catch(() => error1 = true)

  //   setTimeout(() => {
  //     assert.deepEqual(data, {key1: 1, key2: 2}, `全部成功返回所有数据。${data}`);
  //     assert.ok(!error, `全部成功，不触发错误处理。${error}`)
  //     assert.ok(!error1, `全部成功，不触发错误处理。${error1}`)
  //     done();
  //   }, PROMISE_DELAY)
  // });

  // it('输入为部分成功的 promise 对象，应该返回对象数据，且有错误信息', function (done) {
  //   let data;
  //   let error;
  //   promiseAllEnd({key1: Promise.resolve(1), key2: errorPromise, key3: Promise.resolve(3)})
  //     .then(_data => data = _data, _error => error = _error);

  //   setTimeout(() => {
  //     assert.deepEqual(data, {key1: 1, key3: 3}, `部分成功，不成功数据为 undefined。${data}`);
  //     assert.deepEqual(error.errorsByKey, {key2: 'error'}, '部分成功，错误不为空')
  //     done();
  //   }, PROMISE_DELAY)
  // });

  // it('输入为部分成功的 promise 对象，promise.then().then() 调用正常', function (done) {
  //   let data;
  //   let data1;
  //   promiseAllEnd({key1: Promise.resolve(1), key2: errorPromise, key3: Promise.resolve(3)})
  //     .then(_data => {data = _data; return 1;})
  //     .then(_data => data1 = _data)

  //   setTimeout(() => {
  //     assert.deepEqual(data, {key1: 1, key3: 3}, `promise.then().then() 二级调用正常。${data}`);
  //     assert.deepEqual(data1, 1, `promise.then().then() 二级调用正常。${data1}`);
  //     done();
  //   }, PROMISE_DELAY)
  // });

  // it('输入为全部失败的 promise 对象，应该只触发一次错误', function (done) {
  //   let data = null;
  //   let error = null;
  //   let error2 = null;
  //   promiseAllEnd([errorPromise, errorPromise])
  //     .then(_data => data = _data, _error => error = _error)
  //     .catch(_error => error2 = _error);

  //   setTimeout(() => {
  //     assert.ok(!data, `全部失败不触发成功回调。${data}`);
  //     assert.deepEqual(error.errorsByKey, {0: 'error', 1: 'error'}, `全部失败，错误为空.${error.errorsByKey}`)
  //     assert.ok(!error2, `二级调用正常。${error2}`);
  //     done();
  //   }, PROMISE_DELAY)
  // });
});
