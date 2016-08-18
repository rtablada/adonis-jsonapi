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
  const data = request.getAttributes(['email', 'password', 'password-confirmation']);

  response.send(data);
}
```

### `getAttributesCamelCase`

This is the same as `getAttributes`, but will use `change-case` to change property names into camelCase for easier use.

Example
```js
* store(request, response) {
  const data = request.getAttributesCamelCase(['email', 'password', 'password-confirmation']);

  response.send(data);
}
```

### `getAttributesSnakeCase`

This is the same as `getAttributes`, but will use `change-case` to change property names into snake_case for easier use with database tables and Lucid models.

Example
```js
* store(request, response) {
  const data = request.getAttributesSnakeCase(['email', 'password', 'password-confirmation']);

  response.send(data);
}
```

### `getId`

This method will dig into the request JSON and look for `data.id`.

> If the incoming request is not formatted with a `data.id` property, this method will throw a `JsonApiError` with error codes and title `Invalid data root`.

Example
```js
* store(request, response) {
  const data = request.getId();

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
  const data = request.assertId();

  response.send(data);
}
```
