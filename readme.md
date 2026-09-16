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
