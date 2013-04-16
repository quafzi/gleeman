var expect = require('expect.js');
var myapp = require('./myapp');

describe('myapp', function() {
  describe('func_one', function() {
    it('should depend on nothing', function() {
      expect(myapp).to.have.key('func_one');
      expect(myapp.func_one).to.be.an('function');
    });
    it('should return a string', function(done) {
      expect(myapp.func_one(function(err, result) {
        expect(err).to.be(null);
        expect(result).to.be.an('string').and.to.be('func_one_result');
        done();
      }));
    });
  });
  describe('func_two', function() {
    it('should depend on func one', function() {
      expect(myapp).to.have.key('func_two');
      expect(myapp.func_two).to.be.an('array');
      expect(myapp.func_two[0]).to.contain('func_one');
      expect(myapp.func_two[1]).to.be.an('function');
    });
    it('should return a string', function(done) {
      // dependency injection, whoo hoo ;)
      var app = {'core:myapp:func_one': 'huhu'};
      var func = myapp.func_two[1];
      var cb = function(err, result) {
        expect(err).to.be(null);
        expect(result).to.be.an('string').and.to.be('huhu with 2');
        done();
      };
      func(cb, app);
    });
  });
});
