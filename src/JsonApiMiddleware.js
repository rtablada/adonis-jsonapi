const { JsonApiRequest } = require('./JsonApiRequest');

class JsonApi {
  async handle({ request }, next) {
    request.jsonApi = new JsonApiRequest(request);

    await next();
  }
}

module.exports = JsonApi;
