var expect = require('expect.js');
var join = require('path').join;

var gleeman = require('../');

describe('gleeman-loader', function() {
  it('should load on single app', function(testDone) {
    var autoConfig = gleeman({
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
    var autoConfig = gleeman({
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
      // The module itself calls the callback with the result of the
      // dependency (see testfiles/simple-depend/some-app).
      // So we have to give a function that checks, if the 2nd of the
      // parameters is the result of the init function, that was a dependency
      // of this function.
      var cb = function(err, dependencyResult) {
        expect(dependencyResult).to.be(app[initAppNS]);
        testDone();
      };
      // call the function, to check if callback is called with the right
      // arguments
      funcWithDependency(cb, app);
    });
  });

  it('should resolve backward dependencies of two funcs', function(testDone) {
    var autoConfig = gleeman({
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
    var autoConfig = gleeman({
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

  it('should run minimal dependencies if \'runOnly\'-mode', function(done) {
    gleeman({
      appsPath: join(__dirname, 'testfiles'),
      apps: {
        'run-only': {
          appname: '',
        }
      }
    }, 'run-only:appname:func1', function(err, autoConfig) {
      // func1 does not depend on anything, so func2 shouldn't be run
      expect(autoConfig).to.have.key('run-only:appname:func1');
      expect(autoConfig).not.to.have.key('run-only:appname:func2');
      done();
    });
  });
  it('should run minimal dependencies if \'runOnly\'-mode, but run required dependencies', function(done) {
    gleeman({
      appsPath: join(__dirname, 'testfiles'),
      apps: {
        'run-only': {
          appname: '',
        }
      }
    }, 'run-only:appname:func3', function(err, autoConfig) {
      // func3 depends on func2 which depends on func1, so all three should be
      // called
      expect(autoConfig).to.have.key('run-only:appname:func1')
        .and.to.have.key('run-only:appname:func2')
        .and.to.have.key('run-only:appname:func3');
      done();
    });
  });
});
