module.exports = {
  func: ['simple-depend:some-important-init:func', function(cb, initResult) {
    cb(null, initResult);
  }]
};

