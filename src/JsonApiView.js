const i = require('inflect');
const keysIn = require('lodash.keysin');

class JsonApiRelation {
  constructor(serializer, included = false) {
    this.serializer = serializer;
    this.included = included;
  }

  build(use) {
    const serializer = new (use(this.serializer))(use);
    return Object.assign({}, { ref: 'id', included: true },
      serializer.buildNoRelationships());
  }
}

class JsonApiView {
  constructor(use) {
    this.use = use;
  }

  get type() {
    return i.dasherize(i.pluralize(i.underscore(this.constructor.name)));
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

  hasMany(serializer) {
    return new JsonApiRelation(serializer);
  }

  belongsTo(serializer) {
    return new JsonApiRelation(serializer);
  }
  buildNoRelationships() {
    return {
      type: this.type,
      attributes: this.attributes,
    };
  }

  build() {
    const obj = this.buildNoRelationships();

    this.relations.forEach((relation) => {
      obj.attributes.push(relation);
      obj[relation] = this[relation]().build(this.use);
    });

    return obj;
  }
}

module.exports = JsonApiView;
