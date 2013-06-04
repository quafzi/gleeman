module.exports = {
  func1: function(cb) {
    cb();
  },
  func2: ['run-only:appname:func1', function(cb, func1result) {
    cb();
  }],
  func3: ['run-only:appname:func2', function(cb, func1result) {
    cb();
  }],
  func4: function(cb) {
    cb();
  },
};
