const i = require('inflect');
const keysIn = require('lodash.keysin');

class JsonApiRelation {
  constructor(serializer, { included = false, excludeRelation }) {
    this.serializer = serializer;
    this.included = included;
    this.excludeRelation = excludeRelation;
  }

  build(use) {
    const serializer = new (use(this.serializer))(use);

    if (this.included) {
      return Object.assign({}, { ref: 'id', included: this.included },
        serializer.build({ excludeRelation: this.excludeRelation }));
    }

    return { ref: 'id', included: this.included, type: serializer.type };
  }
}

class JsonApiView {
  constructor(use) {
    this.use = use;
  }

  get type() {
    return i.dasherize(i.underscore(this.constructor.name));
  }

  get loadedData() {
    return [].concat(this.attributes, this.relations);
  }

  get attributes() {
    return [];
  }

  get relations() {
    const proto = this.constructor.prototype;
    return Object.getOwnPropertyNames(proto)
      .filter((prop) => ['constructor', 'attributes'].indexOf(prop) !== 0)
      .filter((prop) => typeof this[prop] === 'function')
      .filter((prop) => this[prop]() instanceof JsonApiRelation);
  }

  hasMany(serializer, options) {
    return new JsonApiRelation(serializer, options);
  }

  belongsTo(serializer, options) {
    return new JsonApiRelation(serializer, options);
  }
  buildNoRelationships() {
    return {
      type: this.type,
      attributes: this.attributes,
    };
  }

  build({ excludeRelation } = {}) {
    const obj = this.buildNoRelationships();

    this.relations.forEach((relation) => {
      if (relation !== excludeRelation) {
        obj.attributes.push(relation);
        obj[relation] = this[relation]().build(this.use);
      }
    });

    return obj;
  }
}

module.exports = JsonApiView;
