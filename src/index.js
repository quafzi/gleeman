var join = require('path').join;
var async = require('async');
var _ = require('lodash');

function logError(msg) {
  console.error('\033[31m' + msg + '\033[0m');
}

// With this function you can wrap an other function to log an error to
// console, if the function is not called in time
function assertCall(func, errMsg, time) {
  var timeout = setTimeout(function() {
    logError(errMsg);
  }, time || 1000);
  return function() {
    func.apply(null, arguments);
    clearTimeout(timeout);
  };
}


module.exports = function(config, runOnly, gleemanInitDone) {
  var namespaces = config.apps;
  var packages = config.packages;
  var runAllMode = false;

  // holds configuration for calling async auto function
  var autoConfig = {};

  // holds revert dependencies
  var preparations = {};

  if(_.isUndefined(gleemanInitDone) || _.isFunction(runOnly)) {
    gleemanInitDone = runOnly;
    runAllMode = true;
  }

  // function to init one namespace directory
  var initNamespace = function(ns, nsInitDone) {
    async.each(Object.keys(namespaces[ns]), function(appName, appInitDone) {
      // load app
      app = require(join(config.appsPath, ns, appName));

      // overwrite namespace if exists to preserve namespace from directory
      // logic
      app._namespace = [ns, appName].join(':');

      initApp(app, appInitDone);
      // detect namespace if given
    }, nsInitDone);
  };

  // function to init one given app from namespace or as package
  var initApp = function(app, appInitDone) {
    // iterate over app configuration
    app = _.each(app, function(func, name) {
      //ignore namespace property
      if (name === '_namespace') {
        return;
      }
      // generate key to access app init function
      // namespaceDirName:appName:funcName OR
      // appNamespace:funcName
      var autoKey = [app._namespace, name].join(':');

      // always convert it to array
      func = _.isFunction(func) ? [func] : func;

      // collect all funcKeys which should run after this func
      // their keys follow the func itself
      // e. G. 'runBefore1', 'runBefore2', func, 'runAfter1', 'runAfter2'
      // all dependencys are strings, only func is of type function, 
      // so we rely on the type to seperate them.
      // first, prepares that should run after func.
      var prepares = _.tail(func, _.isString).slice(1);
      if (prepares.length) {
        preparations[autoKey] =  prepares;
      }
      // second dependencies that should run before func incl. func itself
      var depends = _.initial(func, _.isString);
      // pop the func out of the dependencies
      var origFunc = depends.pop();
      // clone the depenedeny list to use it in wrapper function
      var dependsClone = _(depends).clone();
      // wrap function to inject dependencies into it
      var wrappedFunc = function(cb, results) {
        // build all list of arguments, first argument is the callback
        //wrap the callback to log an error to console, if it was not called
        var msg = 'Callback of ' + autoKey + ' not called!';
        var args = [assertCall(cb, msg)];
        // collect the results of the dependend function
        dependsClone.forEach(function(name) {
          if (!_(results).has(name)) {
          }
          args.push(results[name]);
        });
        // add complete results as last argument
        args.push(results);
        // call the original function with the newly generated arguments
        origFunc.apply(null, args);
      };
      // add the new function to the async auto config
      depends.push(wrappedFunc);
      autoConfig[autoKey] = depends;
    });
    // callback
    appInitDone(null);
  };

  // Start the whole process for all namespaces
  var initNamespaces = function(cb) {
    async.each(Object.keys(namespaces), initNamespace, cb);
  };

  var initPackages = function(initPackagesDone) {
    async.each(packages, function(name, initAppDone) {
      initApp(require(name), initAppDone);
    }, initPackagesDone);
  };

  // Checks if all dependencies are actually available and throws error if not 
  // TODO test this!
  var checkDependencyAvailablity = function() {
    var autoKeys = _.keys(autoConfig);
    _.forEach(autoConfig, function(config, name) {
      var dependencies = _.filter(config, _.isString);
      var unknowns = _.difference(dependencies, autoKeys);
      if (unknowns.length) {
        var msg = 'There is no module called ' + unknowns.join(', ') 
                + ' referenced in ' + name;
        logError(msg);
      }
    });
  };

  // Generates an array of all function keys which directly or indirectly are
  // required by 'funcname'
  var getRecursiveDependencies = function(funcname) {
    var dependencies = autoConfig[funcname].slice(0, -1);
    var subDependencies = _.map(dependencies , getRecursiveDependencies);
    subDependencies.push(funcname);
    return _.flatten(subDependencies);
  };

  // only init namespaces or packages if there are any
  var initFuncs = [];
  if (namespaces) {
    initFuncs.push(initNamespaces);
  }
  if (packages) {
    initFuncs.push(initPackages);
  }
  async.parallel(initFuncs, function(err) {
    // So the upper defined init is done.
    // Now we have to add the preparations to auto configuration
    _.each(preparations, function(followers, dependency) {
      // followers is a list of func keys which should run AFTER dependency, so
      // we havt to add its key to all followers auto configuration
      _.each(followers, function(followerKey) {
        // check, if the follower exists
        if (autoConfig[followerKey]) {
          // prepend it as dependency
          autoConfig[followerKey].unshift(dependency);
        } else {
          // TODO typed exception
          throw new Error('Func key not found: "' + followerKey +
            '". Available keys are \n * ' + _.keys(autoConfig).join('\n * '));
        }
      });
    });
    checkDependencyAvailablity();
    msg = 'Not all inits have been done!';
    if (!runAllMode) {
      var dependencies = getRecursiveDependencies(runOnly);
      autoConfig = _.pick(autoConfig, dependencies);
    }
    async.auto(autoConfig, assertCall(function(err, results) {
      gleemanInitDone(err, autoConfig);
    }, msg));
  });
};
