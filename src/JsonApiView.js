const i = require('inflection');
const keysIn = require('lodash.keysin');

class JsonApiRelation {
  constructor(serializer, { ref = 'id', included = false, excludeRelation }) {
    this.serializer = serializer;
    this.ref = ref;
    this.included = included;
    this.excludeRelation = excludeRelation;
  }

  build(use) {
    const serializer = new (use(this.serializer))(use);

    if (this.included) {
      return Object.assign({}, { ref: this.ref, included: this.included },
        serializer.build({ excludeRelation: this.excludeRelation }));
    }

    return { ref: this.ref, included: this.included, type: serializer.type };
  }
}

class JsonApiView {
  constructor(use) {
    this.use = use;
  }

  static typeForAttribute(attribute, record) {
    return i.dasherize(i.underscore(attribute));
  }

  get primaryKey() {
    return 'id';
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
      .filter((prop) => ['constructor', 'attributes', 'build'].indexOf(prop) === -1)
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
      id: this.primaryKey,
      type: this.type,
      attributes: this.attributes,
    };
  }

  build({ excludeRelation, meta } = {}) {
    const obj = this.buildNoRelationships();

    this.relations.forEach((relation) => {
      if (relation !== excludeRelation) {
        obj.attributes.push(relation);
        obj[relation] = this[relation]().build(this.use);
      }
    });

    obj.typeForAttribute = this.constructor.typeForAttribute;

    obj.meta = meta || {};

    return obj;
  }
}

module.exports = JsonApiView;
