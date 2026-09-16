# FetchCustom README

## Introduction

`FetchCustom` is a lightweight wrapper for the native `fetch` API in Node.js, providing additional functionality for handling HTTP requests and responses. It is designed to simplify the request process, especially when dealing with JSON, text, or blob data. This utility leverages the resolve pattern and requires **Node.js 18** due to the native `fetch` support introduced in this version.

## Features

- **JSON Serialization**: Automatically serializes request bodies if they are plain objects or arrays.
- **Custom Error Handling**: Provides a `ResponseError` class for detailed error messages, including HTTP status codes and status text.
- **Data Parsing**: Supports methods for parsing responses as JSON, text, or blobs.
- **Resolve Pattern**: Uses the resolve pattern to handle success and error states more gracefully.
- **Timeout**: Cancel a request automatically after a configurable number of milliseconds.
- **Retry**: Automatically retry failed requests with fixed or exponential backoff.
- **Interceptors**: Hook into a request before it is sent and a response before it is returned.
- **Optional Fast Serialization**: Serialize the body with a compiled [`fast-json-stringify`](https://github.com/fastify/fast-json-stringify) function when you provide a JSON Schema.
- **Optional Key Stripping**: Recursively remove `__proto__`/`constructor`/`prototype` keys from object/array bodies before serializing them.

## Requirements

- **Node.js 18+**: This library relies on the native `fetch` API, which is available from Node.js 18.

## Usage

```bash
npm i fetchcustom-vsm
```

### Import and Setup

```typescript
import { FetchCustom } from './fetchcustom-vsm';
```

### Example Request

```typescript
const fetcher = new FetchCustom();

async function makeRequest() {
  const response = await fetcher.fetchCustom('https://api.example.com/data', {
    method: 'POST',
    body: { key: 'value' },
  });

  const result = await response.toJson();
  if (result.error) {
    console.error('Error:', result.error);
  } else {
    console.log('Data:', result.data);
  }
}

makeRequest();
```

#### `toJson<T>(): Promise<{ data: T | undefined; error: Error | undefined }>`

This method parses the response as JSON and returns the data or error.

**Example:**

```typescript
const result = await fetcher.toJson();
if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('Data:', result.data);
}
```

#### `toText<T>(): Promise<{ data: T | undefined; error: Error | undefined }>`

This method parses the response as plain text.

**Example:**

```typescript
const result = await fetcher.toText();
if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('Text:', result.data);
}
```

#### `toBlob<T>(): Promise<{ data: T | undefined; error: Error | undefined }>`

This method parses the response as a blob.

**Example:**

```typescript
const result = await fetcher.toBlob();
if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('Blob:', result.data);
}
```

### Timeout

Pass a `timeout` (in milliseconds) to the constructor to abort the request automatically. It is combined with any `signal` you pass to `fetchCustom`, so both can cancel the request.

```typescript
const fetcher = new FetchCustom({ timeout: 5000 });
await fetcher.fetchCustom('https://api.example.com/data');
if (fetcher.isTimeoutError) {
  console.error('Request timed out');
}
```

### Retry

Pass a `retry` option to retry failed requests. By default, a request is retried when it fails with a network error, a timeout, or a `5xx` response.

```typescript
const fetcher = new FetchCustom({
  retry: {
    attempts: 3, // total attempts, including the first one
    delayMs: 300, // base delay between attempts
    backoff: 'exponential', // 'fixed' (default) or 'exponential'
    // Optional: override which failures are retried
    retryOn: (error, response) => response?.status === 429,
  },
});
await fetcher.fetchCustom('https://api.example.com/data');
```

### Interceptors

Use `interceptors.request` to modify the request before it is sent, and `interceptors.response` to inspect or transform the response before it is used.

```typescript
const fetcher = new FetchCustom({
  interceptors: {
    request: (input, init) => ({
      input,
      init: {
        ...init,
        headers: { ...init?.headers, Authorization: 'Bearer <token>' },
      },
    }),
    response: (response) => {
      console.log('status', response.status);
      return response;
    },
  },
});
await fetcher.fetchCustom('https://api.example.com/data');
```

### Fast body serialization with `fast-json-stringify`

By default, object/array bodies are serialized with the native `JSON.stringify`, which is fast enough for typical request payloads. If you serialize the same shape of body very frequently and want to shave off native serialization time, pass a `bodySchema` (a [`fast-json-stringify`](https://github.com/fastify/fast-json-stringify) JSON Schema) to compile and cache a dedicated serializer for it:

```typescript
const userSchema = {
  title: 'User',
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' },
  },
};

const fetcher = new FetchCustom();
await fetcher.fetchCustom('https://api.example.com/users', {
  method: 'POST',
  body: { name: 'Ada', age: 30 },
  bodySchema: userSchema,
});
```

Reuse the same `bodySchema` object reference across calls so the compiled serializer is cached instead of recompiled on every request.

### Stripping dangerous keys from the body

`FetchCustom` does not merge the body into any shared object, so `__proto__`/`constructor`/`prototype` keys in it cannot pollute this library's own state. If you're calling a downstream API that you know merges the JSON body it receives in an unsafe way, you can opt into stripping those keys as defense-in-depth before the body leaves your app:

```typescript
const fetcher = new FetchCustom({ stripDangerousKeys: true });
await fetcher.fetchCustom('https://api.example.com/data', {
  method: 'POST',
  body: untrustedBody,
});
```

This is off by default, since it would otherwise reject a legitimate field that happens to be named `constructor` (e.g. a car's `constructor: 'Ford'`). It only protects the receiving server against its own unsafe merge of the body — it is not a substitute for sanitizing that server's input, and it has nothing to do with XSS: this library sends bytes over HTTP, it does not render anything into a DOM, so escaping HTML/script content here would only corrupt legitimate payloads (code snippets, HTML content, etc.) without preventing XSS, which must be handled at the point where data is rendered.

## Error Handling

If the fetch request returns a non-OK status (HTTP status code outside the 2xx range), the library throws a \`ResponseError\` with details such as \`statusText\` and \`statusCode\`.

### 🌐 Important Links

-Homepage: https://github.com/Smejia11/FetchCustom

-Repository: git+https://github.com/Smejia11/FetchCustom.git

-Issues: https://github.com/Smejia11/FetchCustom/issues

### 🤝 Contributing

Contributions are welcome.

Fork the project

Create your feature branch (git checkout -b feature/AmazingFeature)

Execute

```bash
npm run format
```

or

```
pnpm run format
```

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

## License

MIT
