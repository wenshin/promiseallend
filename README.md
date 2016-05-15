# promiseallend
get all promise data even one of them failed

**feature**

 * trigger fullfilled and rejected callback even some promise have failed
 * support input promise array and object


# Install

```
pip i --save promiseallend
```

# Usage

```javascript
let promiseAllEnd = require('promiseallend');

// input promises with array
promiseAllEnd([Promise.resolve(1), Promise.reject('error'), Promise.resolve(2)])
    .then(data => console.log(data)) // [1, undefined, 2]
    .catch(error => console.log(error.errorsByKey)) // {1: 'error'}

// input promises with object
promiseAllEnd({k1: Promise.resolve(1), k2: Promise.reject('error'), k3: Promise.resolve(2)})
    .then(data => console.log(data)) // {k1: 1, k3: 2}
    .catch(error => console.log(error.errorsByKey)) // {k2: 'error'}

```

More usage please see test

# Develop

```
$> npm i
$> npm test
$> npm publish
```

# Release Note

* v1.0.0 2016-05-15

    main feature first stable release
