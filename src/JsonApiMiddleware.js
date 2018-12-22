const JsonApiSerializer = require('jsonapi-serializer').Serializer;
const { JsonApiRequest, JsonApiError, ValidationError } = require('./JsonApiRequest');

function setupSerializer(use) {
  return function (serializerName, data, meta) {
    const helpers = use('Helpers');

    const View = use(helpers.makeNameSpace('JsonApiViews', serializerName));
    const view = new View(use);

    if (data.toJSON && typeof data.toJSON === 'function') {
      data = data.toJSON();
    }

    const pluralizeType = Array.isArray(data);

    const options = Object.assign({}, view.build({ meta: meta }), { pluralizeType });

    const json = new JsonApiSerializer(view.type, options).serialize(data);

    return json;
  };
}

class JsonApi {
  constructor(use) {
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

  async handle({request, response}, next) {
    request.jsonApi = new JsonApiRequest(request);

    await next();
  }
}

module.exports = JsonApi;
