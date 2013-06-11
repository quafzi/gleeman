module.exports = {
  func1: function(cb) {
    cb(null, 'func1Result');
  },
  func2: ['run-only:appname:func1', function(cb, func1result) {
    cb(null, 'func2Result');
  }],
  func3: ['run-only:appname:func2', function(cb, func1result) {
    cb(null, 'func3Result');
  }],
  func4: function(cb) {
    cb(null, 'func4Result');
  },
};
