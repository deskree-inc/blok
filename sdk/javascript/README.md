
# BlokSDK – Vanilla JavaScript SDK for Blok Framework (CDN)

**BlokSDK** is the official lightweight client to execute remote Blok nodes and workflows.  
This SDK is designed specifically for **browser environments** and distributed via **CDN** for easy integration without build tools or dependencies.

---

## 🌐 Getting Started

### 📥 Include via CDN

```html
<script src="https://cdn.yourdomain.com/bloksdk.min.js"></script>
```

This will make `BlokSDK` available globally in the browser:

```js
const client = new BlokSDK().createHttpClient("https://your-atomic-app.com", "your-access-token");
```

---

## 🚀 Example Usage

### Execute a Python Blok 

```html
<script>
  const client = new BlokSDK().createHttpClient("https://your-atomic-app.com", "your-access-token");

  async function run() {
    const response = await client.python3("my-python-node", {
      prompt: "What is the capital of France?"
    });

    if (response.success) {
      console.log("✅ Result:", response.data);
    } else {
      console.error("❌ Error:", response.errors);
    }
  }

  run();
</script>
```

---

### Execute a Node.js Blok (as module)

```js
await client.nodejs("@blok-ts/api-call", {
  url: "https://catfact.ninja/fact",
  method: "GET",
  responseType: "application/json"
});
```

### 📌 Understanding the Parameters

Each SDK method (e.g. `python3`, `nodejs`) expects **two parameters**:

```js
client.python3(nodeName, inputs)
client.nodejs(nodeName, inputs)
```

| Parameter     | Type      | Description                                                                 |
|---------------|-----------|-----------------------------------------------------------------------------|
| `nodeName`    | `string`  | The name of the node to execute. This name must match a registered Blok node. |
| `inputs`      | `object`  | A plain object representing the inputs the Blok node expects at runtime.     |

---

## 🧠 Features

- Zero setup — works in any browser with `<script>` tag
- Executes bloks remotely using **HTTP 1.1**
- Supports runtime types like `python3`, `nodejs`
- Includes simple **debug logging** mode
- Unified response structure with `success`, `data`, `errors`

---

## 🔄 Response Format

Each call returns a consistent response object:

```js
{
  success: true | false,
  data: { ... },         // Parsed JSON response
  rawData: "...",        // Fallback if not JSON
  errors: [ ... ],       // Array of error messages (if any)
  contentType: "...",    // Server response content type
  status: "..."          // Server response status code
}
```

---

## ⚙️ Custom Headers

You may override default headers:
```js
client.setHeaders({
  "x-correlation-id": "abc-123"
});
```

---

## 🧪 Debug Mode

Enable debug logging:
```js
const client = new BlokSDK().createHttpClient("https://your-host", "your-token", true);
```

Console will log:
- Request headers
- Workflow JSON
- Encoded message
- Final fetch URL

---

## 🔐 Requirements

- A valid **Blok Application URL**
- A valid **Access Token** (if required by your Blok deployment)
- Public Blok node endpoints accessible via workflows

---

## ❗ Important Notes

- This SDK does **not support TypeScript**, npm, or Node.js environments.
- It is limited to browser-based use and exposes only HTTP-level functionality.

---

## 🛡 Licensing & Security

This version of BlokSDK is distributed under an open-source license as part of the Blok Framework ecosystem.

---

## 🧑‍💻 Part of [Blok Framework](https://github.com/deskree-inc/blok)
