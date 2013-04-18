var expect = require('expect.js');
var join = require('path').join;

var gleeman = require('../');

describe('gleeman-loader', function() {
  it('should load on single app', function(testDone) {
    var autoconfig = gleeman({
      appsPath: join(__dirname, 'testfiles'),
      apps: {
        namespace: {
          appname: '',
        }
      }
    }, function(err, autoConfig) {
      expect(err).to.be(null);
      var funcNS = 'namespace:appname:func';
      expect(autoConfig).to.have.key(funcNS);
      var funclist = autoConfig[funcNS];
      expect(funclist.length).to.be(1);
      expect(funclist).to.be.a('array');
      expect(funclist[0]).to.be.a('function');
      testDone();
    });
  });

  it('should load two apps functions in correct order', function(testDone) {
    var autoconfig = gleeman({
      appsPath: join(__dirname, 'testfiles'),
      apps: {
        'simple-depend': {
          'some-app': '',
          'some-important-init': '',
        }
      }
    }, function(err, autoConfig) {
      var someAppNS = 'simple-depend:some-app:func';
      var initAppNS = 'simple-depend:some-important-init:func';
      expect(err).to.be(null);
      expect(autoConfig).to.have.keys(someAppNS, initAppNS);
      var funclist = autoConfig[someAppNS];
      expect(funclist.length).to.be(2);
      expect(funclist).to.be.a('array');
      expect(funclist[0]).to.be(initAppNS);
      var funcWithDependency = funclist[1];
      expect(funcWithDependency).to.be.a('function');
      // create a result for init function, that is a dependency for this
      // function
      var app = {};
      app[initAppNS] = 'init result';
      // the module itself calls the callback with all arguments as parameter
      // see testfiles/simple-depend/some-app. So we have to give a function
      // that checks, if the 2nd of the parameters is the result of the init
      // function, that was a dependency of this function
      var cb = function(dependencyResult) {
        expect(dependencyResult[1]).to.be(app[initAppNS]);
        testDone();
      };
      // call the function, to check if callback is called with the right
      // arguments
      funcWithDependency(cb, app);
    });
  });

  it('should resolve backward dependencies of two funcs', function(testDone) {
    var autoconfig = gleeman({
      appsPath: join(__dirname, 'testfiles'),
      apps: {
        'backward-depend': {
          'some-app': ''
        }
      }
    }, function(err, autoConfig) {
      expect(err).to.be(null);
      var appNS = 'backward-depend:some-app:';
      var firstFuncNS = appNS + 'func';
      var lastFuncNS = appNS + 'run-at-last';
      expect(autoConfig).to.have.key(firstFuncNS, lastFuncNS);
      var funclist = autoConfig[lastFuncNS];
      expect(funclist).to.be.a('array');
      expect(funclist.length).to.be(2);
      expect(funclist[0]).to.be(firstFuncNS);
      expect(funclist[1]).to.be.a('function');
      testDone();
    });
  });

  it('should load on single package', function(testDone) {
    var autoconfig = gleeman({
      appsPath: join(__dirname, 'testfiles'),
      packages: [join(__dirname, 'testfiles/packages/gleeman-package')]
    }, function(err, autoConfig) {
      expect(err).to.be(null);
      var funcNS = 'gleeman:gleeman-package:func';
      expect(autoConfig).to.have.key(funcNS);
      var funclist = autoConfig[funcNS];
      expect(funclist.length).to.be(1);
      expect(funclist).to.be.a('array');
      expect(funclist[0]).to.be.a('function');
      testDone();
    });
  });
  
});
