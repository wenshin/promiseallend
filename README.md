# promiseallend

get all promise data even one of them failed

## feature

- trigger fullfilled and rejected callback even some promise have failed
- support input promise array and object

# Install

    pip i --save promiseallend

# API

## Method

`promiseAllEnd(promises[, requireConfig])`

## Parameters

- `promises`: Array or Object.

- `requireConfig`: Array or Object or Boolean, default is false.
    - `false` means all promise is not required. only when all promises rejected will settle the return promise as rejected.
    - `true` means all promise is required. the action is same to Promise.all
    - `[true, false] | {k1: true, k2: false}` means specified promise is required. once required promise rejected will settle return promise as rejected.

# Usage

    let promiseAllEnd = require('promiseallend');

    let promises = [Promise.resolve(1), Promise.reject('error'), Promise.resolve(2)];
    let promisesObj = {k1: Promise.resolve(1), k2: Promise.reject('error'), k3: Promise.resolve(2)};

    // input promises with array
    promiseAllEnd(promises)
        // will call, data is `[1, undefined, 2]`, error.detail is `[undefined, 'error', undefined]`
        .onPendingFinish(({data, error} => console.log(data, error)))
        // will call, data is `[1, undefined, 2]`
        .then(data => console.log(data))
        // won't call
        .catch(error => console.log(error.detail))

    // input promises with object
    promiseAllEnd(promisesObj)
        // will call, data is `{k1: 1, k3: 2}`, error.detail is `{k2: 'error'}`
        .onPendingFinish(({data, error} => console.log(data, error)))
        // will call, data is `{k1: 1, k3: 2}`
        .then(data => console.log(data))
        // won't call
        .catch(error => console.log(error.detail))

    // the same to `Promise.all`
    promiseAllEnd(promises, true)

    // requireConfig is Array
    let requireConfig = [false, true, false];
    promiseAllEnd(promises, requireConfig)
        // won't call
        .then(data => console.log(data))
        // will call, error.detail is `{k2: 'error'}`
        .catch(error => console.log(error.detail))

More usage please see test

# Develop

    $> npm i
    $> npm test
    $> npm publish

# Release Note

v1.1.0 2016-05-22

    * new API but compatible with old one

v1.0.0 2016-05-15

    * main feature first stable release
