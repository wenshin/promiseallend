'use strict';

let assert = require('assert');
let promiseAllEnd = require('../lib');

let PROMISE_DELAY = 5;
let errorPromise = Promise.reject('error');

describe('', function () {
  it('输入为全部成功的 promise 数组，应该返回数组数据，且没有错误', function (done) {
    let result = {};
    promiseAllEnd([Promise.resolve(1), Promise.resolve(2)])
      .then( (data, error) => {
        result = {data, error};
      });

    setTimeout(() => {
      assert.deepEqual(result.data, [1, 2], `全部成功返回所有数据。${result.data}`);
      assert.ok(!result.error, '全部成功，错误为空')
      done();
    }, PROMISE_DELAY)
  });

  it('输入为部分成功的 promise 数组，应该返回数组数据，且有错误信息', function (done) {
    let data;
    let error;
    promiseAllEnd([Promise.resolve(1), errorPromise, Promise.resolve(3)])
      .then(_data => data = _data)
      .catch(_error => error = _error);

    setTimeout(() => {
      assert.deepEqual(data, [1, undefined, 3], `部分成功，不成功数据为 undefined。${data}`);
      assert.deepEqual(error.errorsByKey, {1: 'error'}, '部分成功，错误不为空')
      done();
    }, PROMISE_DELAY)
  });

  it('输入为全部成功的 promise 对象，应该返回对象数据，且没有错误', function (done) {
    let data;
    let error;
    promiseAllEnd({key1: Promise.resolve(1), key2: Promise.resolve(2)})
      .then(_data => data = _data, _error => error = _error);

    setTimeout(() => {
      assert.deepEqual(data, {key1: 1, key2: 2}, `全部成功返回所有数据。${data}`);
      assert.ok(!error, '全部成功，错误为空')
      done();
    }, PROMISE_DELAY)
  });

  it('输入为部分成功的 promise 对象，应该返回对象数据，且有错误信息', function (done) {
    let data;
    let error;
    promiseAllEnd({key1: Promise.resolve(1), key2: errorPromise, key3: Promise.resolve(3)})
      .then(_data => data = _data, _error => error = _error);

    setTimeout(() => {
      assert.deepEqual(data, {key1: 1, key3: 3}, `部分成功，不成功数据为 undefined。${data}`);
      assert.deepEqual(error.errorsByKey, {key2: 'error'}, '部分成功，错误不为空')
      done();
    }, PROMISE_DELAY)
  });

  it('输入为全部失败的 promise 对象，应该只触发 catch', function (done) {
    let data = null;
    let error = null;
    let error2 = null;
    promiseAllEnd([errorPromise, errorPromise])
      .then(_data => data = _data, _error => {error = _error})
      .catch(_error => error2 = _error);

    setTimeout(() => {
      assert.ok(!data, `全部失败不触发成功回调。${data}`);
      assert.deepEqual(error.errorsByKey, {0: 'error', 1: 'error'}, `全部失败，错误为空.${error.errorsByKey}`)
      assert.ok(!error2, `二级调用正常。${error2}`);
      done();
    }, PROMISE_DELAY)
  });
});
