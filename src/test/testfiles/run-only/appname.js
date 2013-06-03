module.exports = {
  func1: function(cb) {
    cb();
  },
  func2: ['run-only:appname:func1', function(cb, func1result) {
    cb();
  }]
};
