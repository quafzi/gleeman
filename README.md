[![Build Status](https://travis-ci.org/gleeman/gleeman.png?branch=master)](https://travis-ci.org/gleeman/gleeman)

#gleeman

####Framework agnostic meta framework

We you build webapps you often run in the problem of having to initialize lots of modules you want to use, may it be httpserver, databases or storage engines. Often they depend on each other and have to be initalized in specific order. THis often leads to a giant ball of init code in your main app.js. It's also difficult to test such code.

With _gleeman_ we tried to build a simple, unopiniated but powerfull module loader, which solves all these problems.

## Example
