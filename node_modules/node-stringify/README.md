# node-stringify 

![Build Status](http://img.shields.io/travis/fuqcool/node-stringify.svg?style=flat-square) ![npm](http://img.shields.io/npm/v/node-stringify.svg?style=flat-square) ![Total Downloads](http://img.shields.io/npm/dm/node-stringify.svg?style=flat-square)

Stringify all types of javascript objects.

## Install

```
npm install node-stringify --save
```

## Example

``` javascript
var stringify = require('node-stringify');

console.assert(stringify(123) === '123');

console.assert(stringify('abc') === '\'abc\'');

console.assert(stringify(null) === 'null');

console.assert(stringify(undefined) === 'undefined');

console.assert(stringify(new Date(1000)) === 'new Date(1000)');

console.assert(stringify(function (a,b,c) {}) === '(function (a,b,c) {})');

console.assert(stringify([1, 2, 3]) === '[1,2,3]');

// The parenthesis is to make the result work with `eval`
console.assert(stringify({a: 1, b: 2}) === '({a:1,b:2})');

console.assert(stringify({a: 1, b: [2, 3]}) === '({a:1,b:[2,3]})');
```

## Supported types

- null
- undefined
- number
- string
- date
- regexp
- function
- array
- object

## Difference with `JSON.stringify`

- `node-stringify` is designed to work with all kinds of objects in javascript. `JSON.stringify` is designed to work with objects.

- The result of `node-stringify` can be retrieved directly using `eval`.

## License
MIT License.
