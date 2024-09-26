
# FetchCustom README

## Introduction
`FetchCustom` is a lightweight wrapper for the native `fetch` API in Node.js, providing additional functionality for handling HTTP requests and responses. It is designed to simplify the request process, especially when dealing with JSON, text, or blob data. This utility leverages the resolve pattern and requires **Node.js 18** due to the native `fetch` support introduced in this version.

## Features
- **JSON Serialization**: Automatically serializes request bodies if they are plain objects or arrays.
- **Custom Error Handling**: Provides a `ResponseError` class for detailed error messages, including HTTP status codes and status text.
- **Data Parsing**: Supports methods for parsing responses as JSON, text, or blobs.
- **Resolve Pattern**: Uses the resolve pattern to handle success and error states more gracefully.

## Requirements
- **Node.js 18+**: This library relies on the native `fetch` API, which is available from Node.js 18.

## Usage

### Import and Setup
\`\`\`typescript
import { FetchCustom } from './FetchCustom';
\`\`\`

### Example Request
\`\`\`typescript
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
\`\`\`

### Methods

- \`fetchCustom(input: RequestInfo, init?: RequestInit): Promise<FetchCustom>\`  
  - A method to perform a fetch request with custom logic for handling body serialization and error responses.

- \`toJson<T>(): Promise<{ data: T | undefined; error: Error | undefined }>\`  
  - A method to parse the response as JSON.

- \`toText<T>(): Promise<{ data: T | undefined; error: Error | undefined }>\`  
  - A method to parse the response as plain text.

- \`toBlob<T>(): Promise<{ data: T | undefined; error: Error | undefined }>\`  
  - A method to parse the response as a blob.

## Error Handling
If the fetch request returns a non-OK status (HTTP status code outside the 2xx range), the library throws a \`ResponseError\` with details such as \`statusText\` and \`statusCode\`.

## License
MIT