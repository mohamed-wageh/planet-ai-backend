# 🌿 Planet AI — Frontend Integration Guide

> **Base URL:** `https://planet-ai-backend-gules.vercel.app/api`
>

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Chat Conversations](#2-chat-conversations)
3. [Sending Messages](#3-sending-messages)
4. [Full User Flow Example](#4-full-user-flow-example)
5. [Error Handling](#5-error-handling)

---

## 1. Authentication

All chat endpoints require a JWT token. Obtain it via Sign Up or Sign In.

### 1.1 Sign Up

```
POST /api/auth/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "ahmed",
  "email": "ahmed@example.com",
  "password": "mypassword123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "665a...",
    "username": "ahmed",
    "email": "ahmed@example.com",
    "token": "eyJhbGci..."
  }
}
```

**Errors:**
| Code | Reason |
|------|--------|
| `400` | Email already exists or validation failed |

---

### 1.2 Sign In

```
POST /api/auth/signin
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "ahmed@example.com",
  "password": "mypassword123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "_id": "665a...",
    "username": "ahmed",
    "email": "ahmed@example.com",
    "token": "eyJhbGci..."
  }
}
```

**Errors:**
| Code | Reason |
|------|--------|
| `401` | Invalid email or password |

---

### 1.3 Using the Token

Save the `token` from sign up/sign in. Add it to **every** chat request:

```
Authorization: Bearer eyJhbGci...
```

Token expires after **30 days**.

---

## 2. Chat Conversations

> All endpoints below require `Authorization: Bearer <token>` header.

### 2.1 Create Conversation

```
POST /api/chat/conversations
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "My Plant Question"
}
```
> `title` is **optional** — defaults to `"New Conversation"` and auto-updates after the first message.

**Response `201`:**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "_id": "665b...",
    "user": "665a...",
    "title": "My Plant Question",
    "createdAt": "2026-06-01T12:00:00.000Z",
    "updatedAt": "2026-06-01T12:00:00.000Z"
  }
}
```

---

### 2.2 List All Conversations

Returns all conversations for the logged-in user, sorted by **most recently updated first**.

```
GET /api/chat/conversations
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "665b...",
      "user": "665a...",
      "title": "My Plant Question",
      "createdAt": "2026-06-01T12:00:00.000Z",
      "updatedAt": "2026-06-01T14:30:00.000Z"
    },
    {
      "_id": "665c...",
      "user": "665a...",
      "title": "Tomato Disease Check",
      "createdAt": "2026-05-30T10:00:00.000Z",
      "updatedAt": "2026-05-30T10:05:00.000Z"
    }
  ]
}
```

---

### 2.3 Get Single Conversation (with Messages)

Returns the conversation details **plus all messages** in chronological order.

```
GET /api/chat/conversations/:id
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "665b...",
    "user": "665a...",
    "title": "My Plant Question",
    "createdAt": "2026-06-01T12:00:00.000Z",
    "updatedAt": "2026-06-01T12:05:00.000Z",
    "messages": [
      {
        "_id": "665d...",
        "conversation": "665b...",
        "role": "user",
        "type": "text",
        "content": "ما هي أعراض البياض الدقيقي؟",
        "createdAt": "2026-06-01T12:01:00.000Z"
      },
      {
        "_id": "665e...",
        "conversation": "665b...",
        "role": "assistant",
        "type": "text",
        "content": "البياض الدقيقي مرض فطري أعراضه الرئيسية هي ظهور طبقة بيضاء...",
        "source": "llm",
        "metadata": {
          "answer": "...",
          "sources": ["...", "..."]
        },
        "createdAt": "2026-06-01T12:01:03.000Z"
      },
      {
        "_id": "665f...",
        "conversation": "665b...",
        "role": "user",
        "type": "image",
        "imageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
        "createdAt": "2026-06-01T12:02:00.000Z"
      },
      {
        "_id": "665g...",
        "conversation": "665b...",
        "role": "assistant",
        "type": "text",
        "content": "🌿 Disease Detection Results:\nTomato Late Blight: 98.5%",
        "source": "cnn",
        "metadata": [
          { "label": "Tomato___Late_blight", "confidence": 0.985 }
        ],
        "createdAt": "2026-06-01T12:02:05.000Z"
      }
    ]
  }
}
```

#### Message Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `role` | `"user"` \| `"assistant"` | Who sent the message |
| `type` | `"text"` \| `"image"` | Message type |
| `content` | `string` | Text content (user question or AI answer) |
| `imageUrl` | `string` | Base64 data-URI of uploaded image (only when `type: "image"`) |
| `source` | `"llm"` \| `"cnn"` | Which AI service produced the response (only on assistant messages) |
| `metadata` | `object` | Raw API response from the AI service (for debugging / extra data) |

---

### 2.4 Update Conversation Title

```
PATCH /api/chat/conversations/:id
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New Title"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Conversation updated successfully",
  "data": {
    "_id": "665b...",
    "title": "New Title",
    "updatedAt": "2026-06-01T14:00:00.000Z"
  }
}
```

---

### 2.5 Delete Conversation

Deletes the conversation **and all its messages**.

```
DELETE /api/chat/conversations/:id
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

## 3. Sending Messages

### 3.1 Send Text Question → LLM

Send a text question about plants. The AI will respond using its plant disease knowledge base.

```
POST /api/chat/conversations/:id/text
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "question": "ما هي أعراض البياض الدقيقي؟"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "_id": "...",
      "role": "user",
      "type": "text",
      "content": "ما هي أعراض البياض الدقيقي؟",
      "createdAt": "..."
    },
    "assistantMessage": {
      "_id": "...",
      "role": "assistant",
      "type": "text",
      "content": "البياض الدقيقي مرض فطري أعراضه الرئيسية هي ظهور طبقة بيضاء...",
      "source": "llm",
      "metadata": {
        "answer": "البياض الدقيقي مرض فطري...",
        "sources": [
          "المرض: البياض الدقيقي على الكرز...",
          "المرض: البياض الدقيقي في الكوسة..."
        ]
      },
      "createdAt": "..."
    }
  }
}
```

> **Tip:** The `metadata.sources` array contains the reference documents the AI used to answer. You can display these as "Sources" in the UI.

---

### 3.2 Upload Plant Image → CNN

Upload a plant leaf image for disease detection.

```
POST /api/chat/conversations/:id/image
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (form-data):**

| Field | Type | Description |
|-------|------|-------------|
| `file` | **File** | The plant leaf image (JPEG, PNG, etc.) — max **10MB** |

**JavaScript Example:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/image`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Do NOT set Content-Type — browser sets it automatically with boundary
  },
  body: formData
});
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "_id": "...",
      "role": "user",
      "type": "image",
      "imageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
      "createdAt": "..."
    },
    "assistantMessage": {
      "_id": "...",
      "role": "assistant",
      "type": "text",
      "content": "🌿 Disease Detection Results:\nTomato Late Blight: 98.5%",
      "source": "cnn",
      "metadata": [
        { "label": "Tomato___Late_blight", "confidence": 0.985 }
      ],
      "createdAt": "..."
    }
  }
}
```

> **Note:** The `userMessage.imageUrl` is a base64 data-URI — you can display it directly in an `<img>` tag: `<img src={message.imageUrl} />`

---

## 4. Full User Flow Example

Here's the typical frontend flow in JavaScript:

```javascript
const BASE_URL = 'https://YOUR-VERCEL-DOMAIN.vercel.app/api';

// 1. Sign in and get token
const authRes = await fetch(`${BASE_URL}/auth/signin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'pass123' })
});
const { data: { token } } = await authRes.json();

// 2. Create a new conversation
const convRes = await fetch(`${BASE_URL}/chat/conversations`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ title: 'My Chat' })
});
const { data: conversation } = await convRes.json();

// 3. Send a text question
const textRes = await fetch(`${BASE_URL}/chat/conversations/${conversation._id}/text`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ question: 'ما هي أعراض البياض الدقيقي؟' })
});
const { data: { userMessage, assistantMessage } } = await textRes.json();

// 4. Upload an image
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const imgRes = await fetch(`${BASE_URL}/chat/conversations/${conversation._id}/image`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// 5. Load conversation history (e.g., when user opens an old chat)
const historyRes = await fetch(`${BASE_URL}/chat/conversations/${conversation._id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: { messages } } = await historyRes.json();
// Render messages — check message.type ('text' or 'image') and message.role ('user' or 'assistant')
```

---

## 5. Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

| Code | Meaning | When |
|------|---------|------|
| `400` | Bad Request | Missing required fields, validation errors |
| `401` | Unauthorized | Missing or invalid JWT token |
| `404` | Not Found | Conversation doesn't exist or doesn't belong to user |
| `502` | Bad Gateway | CNN or LLM external service is temporarily down |
| `500` | Server Error | Unexpected server-side error |

### Handling `502` (AI Service Down)

When the CNN or LLM service is temporarily unavailable, the API returns `502` but **still saves both messages** (the user message + an error message from the assistant). The response includes both:

```json
{
  "success": false,
  "message": "LLM service is currently unavailable",
  "data": {
    "userMessage": { "..." },
    "assistantMessage": {
      "content": "Sorry, I couldn't process your question. Error: ...",
      "source": "llm"
    }
  }
}
```

> The frontend can display the `assistantMessage.content` to the user even on errors.

---

## Quick Reference

| Action | Method | Endpoint | Auth | Body |
|--------|--------|----------|------|------|
| Sign Up | `POST` | `/api/auth/signup` | ❌ | `{ username, email, password }` |
| Sign In | `POST` | `/api/auth/signin` | ❌ | `{ email, password }` |
| Create Chat | `POST` | `/api/chat/conversations` | ✅ | `{ title? }` |
| List Chats | `GET` | `/api/chat/conversations` | ✅ | — |
| Get Chat + Messages | `GET` | `/api/chat/conversations/:id` | ✅ | — |
| Rename Chat | `PATCH` | `/api/chat/conversations/:id` | ✅ | `{ title }` |
| Delete Chat | `DELETE` | `/api/chat/conversations/:id` | ✅ | — |
| Ask Question (LLM) | `POST` | `/api/chat/conversations/:id/text` | ✅ | `{ question }` |
| Upload Image (CNN) | `POST` | `/api/chat/conversations/:id/image` | ✅ | form-data: `file` |
