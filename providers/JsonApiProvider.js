'use strict';

const ServiceProvider = require('adonis-fold').ServiceProvider;
const JsonApiSerializer = require('jsonapi-serializer').Serializer;

function setupSerializer(make, response) {
  return function (serializerName, data, statusCode = 200) {
    const helpers = make('Helpers');

    const { type, serializer } = make(helpers.makeNameSpace('Http/Serializers', serializerName));

    if (data.toJSON && typeof data.toJSON === 'function') {
      data = data.toJSON();
    }
    const pluralizeType = Array.isArray(data);

    const options = Object.assign({}, serializer, { pluralizeType });

    const json = new JsonApiSerializer(type, options).serialize(data);

    this.status(statusCode).json(json);
  };
}

class JsonApiProvider extends ServiceProvider {

  * register() {
    const Response = this.app.use('Adonis/Src/Response');

    // Response.macro('jsonApi', setupSerializer(this.app.use));
  }

}

module.exports = JsonApiProvider;
