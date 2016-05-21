
function PromisesRejectedError(message, errorsByKey={}, isAll=false) {
  this.name = 'PromisesRejectedError';
  this.message = message || `promises in ${Object.keys(errorsByKey)} rejected`;
  this.errorsByKey = errorsByKey;
  this.isAll = isAll;
  this.constructor = PromisesRejectedError;
}

PromisesRejectedError.prototype = Error.prototype;

module.exports = {PromisesRejectedError};
