var expect = require('expect.js');

var gleeman = require('../');

describe('gleeman-loader', function() {
  it('should load on single module', function(testReady) {
    var autoconfig = gleeman({
      appsPath: __dirname,
      apps: {
        namespace: {
          appname: '',
        }
      },
      packages: []
    }, function(err, autoConfig) {
      expect(err).to.be(null);
      expect(autoConfig).to.have.key('namespace:appname:func');
      var funcs = autoConfig['namespace:appname:func'];
      expect(funcs.length).to.be(1);
      expect(funcs).to.be.a('array');
      var func = funcs[0];
      expect(func).to.be.a('function');
      testReady();
    });
    
  });
});
