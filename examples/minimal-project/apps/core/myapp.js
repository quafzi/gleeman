module.exports = {
  func_one: function(func_oneReady) {
    // do something complicated here
    // of cause even async stuff is possible
    var result = 'func_one_result';
    // call the callback, first parameter is the error, second the result of
    // this function
    func_oneReady(null, result);
  },
  // this function depends on the upper on, so we have to mark this
  func_two: ['core:myapp:func_one', function(func_twoReady, resultFromOne) {
    // now we can use the result from above
    func_twoReady(null, resultFromOne + ' with 2');
  }]
};
