
function PromisesRejectedError(message, detail, errorKeys=[]) {
  this.name = 'PromisesRejectedError';
  this.message = message || `promises in ${errorKeys} rejected`;
  this.detail = detail;
  this.isAll = errorKeys.length === Object.keys(detail);
  this.constructor = PromisesRejectedError;
}

PromisesRejectedError.prototype = Error.prototype;

module.exports = {PromisesRejectedError};
