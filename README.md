[![Build Status](https://travis-ci.org/gleeman/gleeman.png?branch=master)](https://travis-ci.org/gleeman/gleeman)

#gleeman

####Framework agnostic meta framework

When you build webapps, you often run into the problem of having to initialize lots
of modules you want to use, e.g. httpserver, databases or storage
engines. They often depend on each other and have to be initalized in specific
order. This often leads to a giant ball of init code in your main app.js. It's
also difficult to test such code.

With _gleeman_ we tried to build a simple, unopiniated but powerfull module
loader, which solves all these problems.

## Example

See the example directory.

Or have a look at the [skeleton project](https://github.com/gleeman/skeleton).

## Why

_gleeman_ uses the asyc.auto feature to resolve the dependencies. This leads
to a number of advantages:
* The dependencies are easily managable in the definition.
* Dependencies can be added and removed easily without any pain.
* _gleeman_ and async.auto care about the loading order.
* You can test your module without having to worry about any initialization of
  the depenedencies, you can set their state as you want - this is called
  _dependency injection_
* By defining a namespace property in your app, it is easy distributable as a
  package to be used in other projects, it can also be deployed to npm so that
  others are able to plug it into their gleeman based projects.

## Usage

Your project starts with a simple js file

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

var run = require('gleeman')(config)
run(function(err, autoConfig) {
  console.log(autoConfig);
});
```

As you can see, _gleeman_-Function takes a configuration object as parameter 
and returns a runner to start the process. This can have an optional callback 
function. This function is called at the end of the initialisation process.

The configuration contains a property `appsPath`. This is required, if you
want to use apps. The `apps`-property itself contains the app you want to use
in your project. Every app belongs to a namespace where it lives in. The
namespace and the app name have to match with the directory structure of the
project. For the upper example the file structure is as follows:

```
examples/minimal-project
├── index.js
└── apps
    └── core
        ├── myapp.js
        └── myapp.test.js
```

### What is an App?

An app is a basic functionality of your project. It can be for example a basic
express server, a css preprocessor, a database connection manager and so
on. An app can add functionality to your project or just provide data.

The app itself consists of several functions. These functions are called in
the defined order by adding dependencies. All these functions get a
callback as first argument. This should be called, when the function has all
data it wants to return. The first parameter should be a potential error that
occured during process, the second is the result of the function. It is stored in the
result object with the namespace of the func as key. The functions that depend
on this function can then access the result of it, because the result is given
as the second, third, ..., n-th parameter of the function. In addition the
whole `result-object` itself is always given as the last parameter.

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
  func_two: ['core:myapp:func_one', function(func_twoReady, resultFromOne) {
    // now we can use the result from above
    func_twoReady(null, resultFromOne + ' with 2');
  }]
};
```

Here we can see two functions defined in a app called `myapp` under the
namespace `core`. `func_one` has no dependencies so there is no need to get
the app argument. It adds on property to the `app-object`, the key is derived
from the namespace, app name and function name. In this case it will be
`core:myapp:func_one`. `func_two` depends on `func_one` so we have to add it
as dependency. Because we do this, it will run after `func_one`s result is
present in the `app-object`. That's why we can access it afterwards.

### Backward dependencies or follow ups

The upper dependency can also be defined the other way around:

```javascript
module.exports = {
  func_one: [function(func_oneDone) {
    var result = 'func_one_result';
    func_oneDone(null, result);
  }, 'core:myapp:func_two'],
  func_two: function(func_twoReady, results) {
    var resultFromOne = results['core:myapp:func_one'];
    func_twoReady(null, resultFromOne + ' with 2');
  }
};
```

As you might spot, `func_one` has now an _array_-definition. But because the
`func_two`-namespace is now after the function definition, the dependencies
are resolved as in the prior example.

In this case, this makes no sense and is also errorprone, because in
`func_two` we rely on data of `func_one` without explicitly knowing about it.
A typical use case can be to provide a function to add files to a list (e. g.
stylus files to render to css). You might want to start the rendering of the
_stylus_ files just after all other apps have added their files to the list.
So you define the rendering function as a follow up function to all functions
that add a file to the list.

###Packages

Besides apps in namespaces, it's also possible to add packages to your project.
They are standard npm modules. They have pretty much the same api as normal
apps. They should export an object with the functions and dependencies they
want to provide. In addition, they have to provide a property `_namespace`.
This contains a string to access the packages' results or depend on one of
it's functions. This is the express server package we build:

```javascript
var express = require('express');

// Create server
var expressServer = express();

// Basic configuation
expressServer.configure(function(){
  expressServer.use(express.bodyParser());
  expressServer.use(express.methodOverride());
  expressServer.use(expressServer.router);
});

// ... some other initialisations

module.exports = {
  _namespace: 'gleeman:express',
  server: function(cb) {
    cb(null, expressServer);
  },
};
```

As you can see it provides one function which returns the express server. If
your function depends on that express server, you can add it as dependency by
using `gleeman:express:server`. The name is generated by the namespace
property and the name of the function.

We pre-built some frequently required modules
* [gleeman-express](https://github.com/gleeman/gleeman-express) 
  Basic express server
* [gleeman-express-http](https://github.com/gleeman/gleeman-express-http) 
  Basic http server which hooks in the express server
* [gleeman-config](https://github.com/gleeman/gleeman-config) 
  Simple config module to provide configuration for your app

You may also find them useful to learn how to use `gleeman`.

## License

(The MIT License)

Copyright (c) 2012 Stephan Hoyer <ste.hoyer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
