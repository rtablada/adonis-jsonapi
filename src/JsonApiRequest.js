const NE = require('node-exceptions');

class JsonApiError extends NE.LogicalException {}

class ValidationError extends NE.LogicalException {
  constructor(validator, status = 400) {
    super('', status);
    this.validator = validator;
  }

  makeErrors() {
    return this.validator.messages().map((err) => ({
      status: this.status,
      source: { pointer: `/data/attributes/${err.field}` },
      title: 'Invalid Attribute',
      detail: err.message,
    }));
  }
}

const pick = require('lodash.pick');
const mapKeys = require('lodash.mapkeys');
const changeCase = require('change-case');

class JsonApiRequest {
  /**
   * Setups the JsonApiRequest object
   * @param  Adonis/Request request
   * @return void
   */
  constructor(request) {
    this.request = request;
  }

  getAttributes(picker) {
    try {
      const { data: { attributes } } = this.request.all() || {};

      if (picker) {
        return pick(attributes, picker);
      }

      return attributes;
    } catch (e) {
      throw new JsonApiError({
        code: '400',
        title: 'Invalid data root',
        detail: 'Missing `data` Member at document\'s top level.',
      }, 400);
    }
  }

  getAttributesSnakeCase(picker) {
    return mapKeys(this.getAttributes(picker), (value, key) => changeCase.snake(key));
  }

  getAttributesCamelCase(picker) {
    return mapKeys(this.getAttributes(picker), (value, key) => changeCase.camel(key));
  }

  getId() {
    try {
      const { data: { id } } = this.request.all() || {};

      return id;
    } catch (e) {
      throw new JsonApiError({
        code: '400',
        title: 'Invalid data root',
        detail: 'Missing `data` Member at document\'s top level.',
      }, 400);
    }
  }

  assertId(testId) {
    const id = this.getId();

    if (id !== testId) {
      throw new JsonApiError({
        code: '400',
        title: 'Id mismatch',
        description: 'Id for request body does not match id in URL',
      }, 400);
    }
  }

  * assertValid(input, rules, messages) {
    const Validator = use('Validator');
    const validation = yield Validator.validateAll(input, rules, messages);

    if (validation.fails()) {
      throw new ValidationError(validation);
    }
  }

  getRelationId(relationName) {
    try {
      const { data: { relationships } = {} } = this.request.all() || {};

      if (Array.isArray(relationships[relationName].data)) {
        return relationships[relationName].data.map((i) => i.id);
      }
      return relationships[relationName].data.id;
    } catch (e) {
      throw new JsonApiError({
        code: '400',
        title: 'Relation not found',
        detail: `Missing "${relationName}" Member in "data" key.`,
      }, 400);
    }
  }
}

module.exports = {
  JsonApiRequest,
  JsonApiError,
  ValidationError,
};
