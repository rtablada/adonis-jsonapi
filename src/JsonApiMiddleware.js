'use strict';

const JsonApiSerializer = require('jsonapi-serializer').Serializer;
const { JsonApiRequest, JsonApiError } = require('./JsonApiRequest');

function setupSerializer(use) {
  return function (serializerName, data, statusCode = 200) {
    const helpers = use('Helpers');

    const { type, serializer } = use(helpers.makeNameSpace('Http/Serializers', serializerName));

    if (data.toJSON && typeof data.toJSON === 'function') {
      data = data.toJSON();
    }
    const pluralizeType = Array.isArray(data);

    const options = Object.assign({}, serializer, { pluralizeType });

    const json = new JsonApiSerializer(type, options).serialize(data);

    this.status(statusCode).json(json);
  };
}

class JsonApi {

  constructor(use) {
    const Response = use('Adonis/Src/Response');

    Response.macro('jsonApi', setupSerializer(use));

    Response.macro('isJsonApiError', (err) => err instanceof JsonApiError);
    Response.macro('jsonApiError', function (err) {
      this.status(err.status).json({ errors: [err.message] });
    });
  }

  * handle(request, response, next) {
    request.jsonApi = new JsonApiRequest(request);

    yield next;
  }

}

module.exports = JsonApi;
