'use strict';

let fold;

try {
  fold = require('adonis-fold');
} catch (_) {
  // workaround when `npm link`'ed for development
  const prequire = require('parent-require');
  fold = prequire('adonis-fold');
}

const ServiceProvider = fold.ServiceProvider;

class JsonApiProvider extends ServiceProvider {

  * register() {

  }

}

module.exports = JsonApiProvider;
