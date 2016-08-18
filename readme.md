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
