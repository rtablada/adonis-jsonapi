# Adonis JSON API

This addon adds JSONApi Support and helpers for Adonis projects.

> **NOTE** This addon is currently under development so APIs, methods, and class structures may change (though I will try my best to keep docs up to date).

## Installation

To install this addon into you Adonis project follow these steps:

Run:

```bash
npm install --save adonis-jsonapi
```

To the `providers` array in `bootstrap/app.js` add:

```js
'adonis-jsonapi/providers/JsonApiProvider',
```

To the `globalMiddleware` array in `app/Http/kernel.js` add:

```js
'AdonisJsonApi/Middleware',
```

Now your app is ready to start using this addon!

## Request Helpers

The `AdonisJsonApi` middleware adds a `JsonApiRequest` instance to all incoming requests as `jsonApi`.
This class has a few methods that help parse incoming JSON API data.

### `getAttributes`

This method will dig into the request JSON and look for `data.attributes`.
The `getAttributes` method optionally accepts an array of attributes and will use the Lodash `pick` function to get only a select set of attributes (similar to `request.only`).

> If the incoming request is not formatted with an object of `data.attributes`, this method will throw a `JsonApiError` with error codes and title `Invalid data root`.

Example
```js
* store(request, response) {
  const data = request.jsonApi.getAttributes(['email', 'password', 'password-confirmation']);

  response.send(data);
}
```

### `getAttributesCamelCase`

This is the same as `getAttributes`, but will use `change-case` to change property names into camelCase for easier use.

Example
```js
* store(request, response) {
  const data = request.jsonApi.getAttributesCamelCase(['email', 'password', 'password-confirmation']);

  response.send(data);
}
```

### `getAttributesSnakeCase`

This is the same as `getAttributes`, but will use `change-case` to change property names into snake_case for easier use with database tables and Lucid models.

Example
```js
* store(request, response) {
  const data = request.jsonApi.getAttributesSnakeCase(['email', 'password', 'password-confirmation']);

  response.send(data);
}
```

### `getId`

This method will dig into the request JSON and look for `data.id`.

> If the incoming request is not formatted with a `data.id` property, this method will throw a `JsonApiError` with error codes and title `Invalid data root`.

Example
```js
* store(request, response) {
  const data = request.jsonApi.getId();

  response.send(data);
}
```

### `assertId`

This method takes a single argument `testId` and checks to see if the value of the incoming `data.id` matches.
If the values do not match, then a `JsonApiError` with error code 400 and title `Id mismatch` is thrown.

> If the incoming request is not formatted with a `data.id` property, this method will throw a `JsonApiError` with error codes and title `Invalid data root`.

Example
```js
* store(request, response) {
  request.jsonApi.assertId(reqest.params.id);

  response.send(data);
}
```

### `getRelationId`

This function gets the `id` for a specified relation name. If the relation is an hasMany relation, the function will return an array of ids.

> If the incoming request is not formatted with the required relation, this method will throw a `JsonApiError` with error codes and title `Relation not found`.

Example
```js
* store(request, response) {
  const data = request.jsonApi.getAttributes(['email', 'password', 'password-confirmation']);
  data.user_id = request.jsonApi.getRelationId('author');

  response.send(data);
}
```

## Serializing Response Data

Serializing data takes two steps:

1. Creating JsonApiView's to describe attributes and relationships
2. Using the `jsonApi` response macro to serialize data

### Creating Views

To create a view, create a new module in `App/Http/JsonApiViews`.
For instance to serialize a lucid model named `Author`, create a file `app/Http/JsonApiViews/Author.js`.
From this new module, export a class that extends from `adonis-jsonapi/src/JsonApiView`:

```js
const JsonApiView = require('adonis-jsonapi/src/JsonApiView');

class Author extends JsonApiView {

}

module.exports = Author;
```

#### Describing Attributes

Attributes are values that should be directly serialized as part of `data.attributes` for a single model instance.
To describe the properties to be serialized, add a getter method called `attributes` that returns an array of dasherized property names:

```js
const JsonApiView = require('adonis-jsonapi/src/JsonApiView');

class Author extends JsonApiView {
  get attributes() {
    return ['first-name', 'last-name'];
  }
}

module.exports = Author;
```

#### Describing Relationships

To create relations, create a method for the relation name and use either `this.belongsTo` or `this.hasMany` just like Lucid relations.
But instead of putting the name of a model, you will put the name of the serializer for the related model.
Let's say our `Author` has many `Book`s:

```js
const JsonApiView = require('adonis-jsonapi/src/JsonApiView');

class Author extends JsonApiView {
  get attributes() {
    return ['first-name', 'last-name'];
  }

  books() {
    return this.hasMany('App/Http/JsonApiViews/Book', {
      included: true,
      excludeRelation: 'author'
    });
  }
}

module.exports = Author;
```

> **NOTE** the options object included with the relation is required since circular object references are really annoying.
> I hope that this was more automatic (if anyone is looking to help!).

> **NOTE** Since JSON API does not have a specification of ownership, only `belongsTo` and `hasMany` relationships are needed for JsonApiViews.
> So for `hasOne` relations use `belongsTo` for both sides, and for `belongsToMany` use a `hasMany` relation.

## Error Handling

To help format errors to JSON API specifications, there is a response macro `JsonApiError`.
A simple setup is to replace the Http handleError listener in `app/Listeners/Http.js`:

```js
Http.handleError = function * (error, request, response) {
/**
 * DEVELOPMENT REPORTER
 */
  if (Env.get('NODE_ENV') === 'development') {
    return (new Ouch)
      .pushHandler((new Ouch.handlers.JsonResponseHandler(
            /* handle errors from ajax and json request only*/false,
            /* return formatted trace information along with error response*/false,
            false
        )))
      // .pushHandler(new Ouch.handlers.PrettyPageHandler())
      .handleException(error, request.request, response.response, (output) => {
        const status = error.status || 500;

        response.status(status).send(JSON.parse(output));
        console.log('Error handled properly');
      });
  }

  yield response.jsonApiError(error);
};
```

> **NOTE** This macro shows the `name` and `message` properties but not the stack for errors.
> This may not be what you want since it may expose too much information about your environment.
> This macro will never show the full stack trace, instead work is being done to bring Youch up to date with a JsonApiResponseHandler.
