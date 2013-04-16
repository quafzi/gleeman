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
      expect(funclist[0]).to.be.a('function');
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
      var someAppNS = 'simple-depend:some-app:func';
      var initAppNS = 'simple-depend:some-important-init:func';
      expect(err).to.be(null);
      expect(autoConfig).to.have.keys(someAppNS, initAppNS);
      var funclist = autoConfig[someAppNS];
      expect(funclist.length).to.be(2);
      expect(funclist).to.be.a('array');
      expect(funclist[0]).to.be(initAppNS);
      expect(funclist[1]).to.be.a('function');
      testReady();
    });
  });

  it('should resolve backward dependencies of two funcs', function(testReady) {
    var autoconfig = gleeman({
      appsPath: join(__dirname, 'testfiles'),
      apps: {
        'backward-depend': {
          'some-app': ''
        }
      },
      packages: []
    }, function(err, autoConfig) {
      expect(err).to.be(null);
      var appNS = 'backward-depend:some-app:'
      var firstFuncNS = appNS + 'func';
      var lastFuncNS = appNS + 'run-at-last';
      expect(autoConfig).to.have.key(firstFuncNS, lastFuncNS);
      var funclist = autoConfig[lastFuncNS];
      expect(funclist).to.be.a('array');
      expect(funclist.length).to.be(2);
      expect(funclist[0]).to.be(firstFuncNS);
      expect(funclist[1]).to.be.a('function');
      testReady();
    });
  });
});
