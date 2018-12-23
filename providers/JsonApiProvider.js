const { ServiceProvider, ioc } = require('@adonisjs/fold');
const JsonApiSerializer = require('jsonapi-serializer').Serializer;
const { JsonApiError, ValidationError } = require('../src/JsonApiRequest');
const Helpers = use('Helpers');

function setupSerializer(use) {
  return function (serializerName, data, meta) {

    const View = require(Helpers.appRoot() + '/app/JsonApiViews/' + serializerName + '.js')
    const view = new View(use)

    if (data.toJSON && typeof data.toJSON === 'function') {
      data = data.toJSON()
    }

    const pluralizeType = Array.isArray(data)
    const options = Object.assign({}, view.build({ meta: meta }), { pluralizeType })
    const json = new JsonApiSerializer(view.type, options).serialize(data)

    return json
  };
}

class JsonApiProvider extends ServiceProvider {
  async boot () {
    const Response = use('Adonis/Src/Response');
    const serializer = setupSerializer(use);

    Response.macro('serializePayload', serializer);
    Response.macro('jsonApi', function (serializerName, data, meta = {}, statusCode = 200) {
      const json = serializer(serializerName, data, meta);

      this.status(statusCode).json(json);
    });

    Response.macro('isJsonApiError', (err) => err instanceof JsonApiError);
    Response.macro('isValidationError', (err) => err instanceof ValidationError);
    Response.macro('jsonApiError', function (err) {
      if (err instanceof ValidationError) {
        this.status(err.status).json({ errors: err.makeErrors() });
      } else if (err instanceof JsonApiError) {
        this.status(err.status).json({ errors: [err.message] });
      } else {
        this.status(err.status).json({ errors: [{
          status: err.status,
          title: err.name,
          detail: err.message,
        }] });
      }
    });
  }

  async register() {
    ioc.bind('Adonis/Middleware/JsonApi', (app) => {
      const JsonApi = require('../src/JsonApiMiddleware');

      return new JsonApi(app.use);
    });
  }
}

module.exports = JsonApiProvider;
