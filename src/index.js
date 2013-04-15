var join = require('path').join;
var async = require('async');
var _ = require('lodash');

module.exports = function(config) {
  var namespaces = config.apps;
  var packages = config.packages;

  // holds configuration for calling async auto function
  var autoConfig = {};

  // holds revert dependencies
  var preparations = {};

  // function to init one namespace directory
  var initNamespace = function(ns, nsInitReady) {
    async.each(Object.keys(namespaces[ns]), function(appName, appInitReady) {
      // load app
      app = require(join(config.appsPath, ns, appName));

      // overwrite namespace if exists to preserve namespace from directory
      // logic
      app._namespace = [ns, appName].join(':');

      initApp(app, appInitReady);
      // detect namespace if given
    }, nsInitReady);
  };

  // function to init one given app from namespace or as package
  var initApp = function(app, appInitReady) {
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
      // this is already applied to auto configuration, since async auto
      // expects exactly this format.
      autoConfig[autoKey] = _.initial(func, _.isString);
    });
    // callback
    appInitReady(null);
  };

  // Start the whole process for all namespaces
  var initNamespaces = function(cb) {
    async.each(Object.keys(namespaces), initNamespace, cb);
  };

  var initPackages = function(cb) {
    async.each(packages, function(name) {
      initApp(require(name), cb);
    });
  };


  async.parallel([initNamespaces, initPackages], function(err) {
    if (err) {
      throw err;
    }
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
  });
  async.auto(autoConfig);
};

