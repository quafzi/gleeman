module.exports = {
  'run-at-last': function(cb) {
    cb();
  },
  func: [function(cb) {
    cb();
  }, 'backward-depend:some-app:run-at-last'],
};

