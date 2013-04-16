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
