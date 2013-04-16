var expect = require('expect.js');
var join = require('path').join;

var gleeman = require('../');

describe('gleeman-loader', function() {
  it('should load on single app', function(testReady) {
    var autoconfig = gleeman({
      appsPath: join(__dirname, 'testfiles'),
      apps: {
        namespace: {
          appname: '',
        }
      },
      packages: []
    }, function(err, autoConfig) {
      expect(err).to.be(null);
      expect(autoConfig).to.have.key('namespace:appname:func');
      var funclist = autoConfig['namespace:appname:func'];
      expect(funclist.length).to.be(1);
      expect(funclist).to.be.a('array');
      var func = funclist[0];
      expect(func).to.be.a('function');
      testReady();
    });
    
  });

  it('should load two apps functions in correct order', function(testReady) {
    var autoconfig = gleeman({
      appsPath: join(__dirname, 'testfiles'),
      apps: {
        'simple-depend': {
          'some-app': '',
          'some-important-init': '',
        }
      },
      packages: []
    }, function(err, autoConfig) {
      var someAppNS = 'simple-depend:some-app:func'
      var initAppNS = 'simple-depend:some-important-init:func'
      expect(err).to.be(null);
      expect(autoConfig).to.have.key(someAppNS);
      expect(autoConfig).to.have.key(initAppNS);
      var funclist = autoConfig[someAppNS];
      expect(funclist.length).to.be(2);
      expect(funclist).to.be.a('array');
      expect(funclist[0]).to.be(initAppNS);
      var func = funclist[1];
      expect(func).to.be.a('function');
      testReady();
    });
  });
});
