# promiseallend

get all promise data even one of them failed

## feature

- trigger fullfilled and rejected callback even some promise have failed
- support input promise array and object

# Install

    npm i --save promiseallend

# API

## Method

`promiseAllEnd(promises[, requireConfig])`

## Parameters

- `promises`: Array or Object.

- `options`: Object

- `options.requireConfig`: [Array|Object|Boolean], default is false.
    - `false` means all promise is not required. only when all promises rejected will settle the returned promise as rejected.
    - `true` means all promise is required. the action is same with Promise.all
    - `Array|Object` eg. `[true, false]`, `{k1: true, k2: false}`, means specified promise is required. once required promise rejected will settle return promise as rejected.

- `options.unhandledRejection`: [Function(err: Error, key: Number|String)]
   if the promises is Array, the key argument will be a Number.
   the promises is Object, the key  will be the String.


# Usage

```javascript
const promiseAllEnd = require('promiseallend');

const promises = [Promise.resolve(1), Promise.reject('error'), Promise.resolve(2)];
const promisesObj = {k1: Promise.resolve(1), k2: Promise.reject('error'), k3: Promise.resolve(2)};

// input promises with array
promiseAllEnd(promises, {
    unhandledRejection(error, index) {
        // error is the original error which is 'error'.
        // index is the index of array, it's a number.
        console.log(error, index);
    }
})
    // will call, data is `[1, undefined, 2]`
    .then(data => console.log(data))
    // won't call
    .catch(error => console.log(error.detail))

// input promises with object
promiseAllEnd(promisesObj, {
    unhandledRejection(error, prop) {
        // error is the original error.
        // key is the property of object.
        console.log(error, prop);
    }
})
    // will call, data is `{k1: 1, k3: 2}`
    .then(data => console.log(data))
    // won't call
    .catch(error => console.log(error.detail))

// the same to `Promise.all`
promiseAllEnd(promises, {requireConfig: true})
    // will call, `error.detail` is 'error', `error.key` is number 1.
    .catch(error => console.log(error.detail))

// requireConfig is Array
promiseAllEnd(promises, {requireConfig: [false, true, false]})
    // won't call
    .then(data => console.log(data))
    // will call, `error.detail` is 'error', `error.key` is number 1.
    .catch(error => console.log(error.detail))

// requireConfig is Array
promiseAllEnd(promises, {requireConfig: [true, false, false]})
    // will call, data is `[1, undefined, 2]`.
    .then(data => console.log(data))
    // won't call
    .catch(error => console.log(error.detail))
```

More usage please see test

# Develop

    $> npm i
    $> npm test
    $> npm publish

# Release Note

v2.0.2 2017-08-23
    * the error message more friendly
    * compatibel browser and nodejs

v2.0.1 2017-06-22
    * global unhandledRejection
    * promiseAllEnd(promises) promises is [] or {} will return [] or {}

v2.0.0 2017-02-23
    * new API


v1.1.1 2016-07-22

    * bug fix

v1.1.0 2016-05-22

    * new API but compatible with old one

v1.0.0 2016-05-15

    * main feature first stable release
