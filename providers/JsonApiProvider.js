'use strict';

const ServiceProvider = require('adonis-fold').ServiceProvider;

class JsonApiProvider extends ServiceProvider {

  * register() {
    this.app.bind('AdonisJsonApi/Middleware', (app) => {
      const JsonApi = require('../src/JsonApiMiddleware');

      return new JsonApi(app.use);
    });
  }

}

module.exports = JsonApiProvider;
