[![Build Status](https://travis-ci.org/gleeman/gleeman.png?branch=master)](https://travis-ci.org/gleeman/gleeman)

#gleeman

####Framework agnostic meta framework

We you build webapps you often run in the problem of having to initialize lots of modules you want to use, may it be httpserver, databases or storage engines. Often they depend on each other and have to be initalized in specific order. THis often leads to a giant ball of init code in your main app.js. It's also difficult to test such code.

With _gleeman_ we tried to build a simple, unopiniated but powerfull module loader, which solves all these problems.

## Example

See the example directory.

## Why

_gleeman_ uses the asyc.auto feature to resolve the dependencies. This leads to a number of advantages:
* The dependencies are easily managable in the definition.
* Dependencies can easaly added and removed without any pain.
* gleeman and async.auto care about the loading order.
* You can test you module with out having to worry about any initialisation of the depenedencies, you can set there state as you want - this is called _depenecy injection_
* By defining a namespace property in you app, it is easy distributable as a package to be used in other projects, it can also be deployed to npm so that others are able to plug it into there gleeman based projects.

## Usage

Your project starts with a simple js-file

```javascript
var join = require('path').join;

var config = {
  appsPath: join(__dirname, 'apps'),
  apps: {
    core: {
      myapp: '',
    }
  }
};

require('gleeman')(config, function(err, autoConfig) {
  console.log(autoConfig);
});
```

As you can see, _gleeman_-Function takes a configuration object and an optional callback function. This function is called at the end of the initialisation process.

The configuration contains a property `appsPath`. This is requiered, if you want to use apps. The `apps`-property itself contains the app you want to use in you project. Every app belongs to a namespace where it lives in. The namespace and the app name have to match with the directory structure of the project. For the upper example the file structure is as follows:

```
examples/minimal-project
├── index.js
└── apps
    └── core
        ├── myapp.js
        └── myapp.test.js
```

### What is an App?

An app is a basic functionality of your project. It can be for example a basic express server, a css preprocessor, a database connection manager and so forth. An app can add functionality to your project or just provide data.

The app itself constist of several functions. These functions are called in the order you define by addind depenedencies. All these functions get a callback as first argument. This should be called, when the function has all data it wants to return. The first parameter is an potential error that occurs during process, the second is the result of the function. It is stored in the app-object with the namespace of the func as key. Following functions can then access the result of this one, because this `app-object` is handed as second parameter to the function.

```javascript
module.exports = {
  func_one: function(func_oneDone) {
    // do something complicated here
    // of cause even async stuff is possible
    var result = 'func_one_result';
    // call the callback, first parameter is the error, second the result of
    // this function
    func_oneDone(null, result);
  },
  // this function depends on the upper on, so we have to mark this
  func_two: ['core:myapp:func_one', function(func_twoReady, app) {
    // now we can use the result from above
    var resultFromOne = app['core:myapp:func_one'];
    func_twoReady(null, resultFromOne + ' with 2');
  }]
};
```

Here we can see two functions defined in a app called `myapp` under the namespace `core`. `func_one` has no dependencies so there is no need to get the app argument. It adds on property to the `app-object`, the key is derived from the namespace, app name and function name. In this case it will be `core:myapp:func_one`. `func_two` depends on `func_one` so we have to add it as depenency. Because we do this, it will run after `func_one`s result is present in the `app-object`. That's why we can access it afterwards.
