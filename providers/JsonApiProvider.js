const { ServiceProvider } = require('@adonisjs/fold');

class JsonApiProvider extends ServiceProvider {
  async register() {
    this.app.bind('AdonisJsonApi/Middleware', (app) => {
      const JsonApi = require('../src/JsonApiMiddleware');

      return new JsonApi(app.use);
    });
  }
}

module.exports = JsonApiProvider;
