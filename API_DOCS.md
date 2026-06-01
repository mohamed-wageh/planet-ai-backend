# Planet Backend API Documentation

Base URL (Local): `http://localhost:5001/api`
*(If hosted, replace `localhost:5001` with your production domain)*

---

## 1. Health Check

Checks if the server is running correctly.

- **URL:** `/health`
- **Method:** `GET`
- **Auth required:** NO

### Success Response
- **Code:** `200 OK`
- **Content:**
  ```json
  {
    "status": "OK",
    "message": "Server is up and running"
  }
  ```

---

## 2. Authentication

### A. Sign Up (Register)

Create a new user account.

- **URL:** `/auth/signup`
- **Method:** `POST`
- **Auth required:** NO
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "username": "omarkhater",
  "email": "omar@example.com",
  "password": "securepassword123"
}
```

#### Success Response
- **Code:** `201 Created`
- **Content:**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "_id": "651a2b3c4d5e6f7a8b9c0d1e",
      "username": "omarkhater",
      "email": "omar@example.com",
      "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
    }
  }
  ```

#### Error Responses
- **Code:** `400 Bad Request` (User already exists)
  ```json
  {
    "success": false,
    "message": "User already exists"
  }
  ```
- **Code:** `400 Bad Request` (Validation Error e.g., weak password)
  ```json
  {
    "success": false,
    "error": ["Password must be at least 6 characters long"]
  }
  ```

---

### B. Sign In (Login)

Authenticate an existing user and receive a JWT token.

- **URL:** `/auth/signin`
- **Method:** `POST`
- **Auth required:** NO
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "email": "omar@example.com",
  "password": "securepassword123"
}
```

#### Success Response
- **Code:** `200 OK`
- **Content:**
  ```json
  {
    "success": true,
    "message": "User logged in successfully",
    "data": {
      "_id": "651a2b3c4d5e6f7a8b9c0d1e",
      "username": "omarkhater",
      "email": "omar@example.com",
      "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
    }
  }
  ```

#### Error Responses
- **Code:** `401 Unauthorized` (Invalid credentials)
  ```json
  {
    "success": false,
    "message": "Invalid email or password"
  }
  ```

---

## 3. How to use Protected Routes

To access routes that require authentication (routes utilizing the `protect` middleware), you must include the JWT token in the `Authorization` header of your HTTP request.

- **Header Name:** `Authorization`
- **Header Value:** `Bearer YOUR_JWT_TOKEN_HERE`

Example using cURL:
```bash
curl -X GET http://localhost:5001/api/some-protected-route \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5c..."
```

---

## 4. Chat System

All chat endpoints require authentication via the `Authorization: Bearer <token>` header.

### A. Create Conversation

Create a new conversation for the logged-in user.

- **URL:** `/chat/conversations`
- **Method:** `POST`
- **Auth required:** YES
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "title": "My Plant Query"
}
```
> `title` is optional. Defaults to `"New Conversation"` and auto-updates after the first message.

#### Success Response
- **Code:** `201 Created`
- **Content:**
  ```json
  {
    "success": true,
    "message": "Conversation created successfully",
    "data": {
      "_id": "665a1b2c3d4e5f6a7b8c9d0e",
      "user": "651a2b3c4d5e6f7a8b9c0d1e",
      "title": "My Plant Query",
      "createdAt": "2026-06-01T12:00:00.000Z",
      "updatedAt": "2026-06-01T12:00:00.000Z"
    }
  }
  ```

---

### B. Get All Conversations

List all conversations for the logged-in user, sorted by most recently updated.

- **URL:** `/chat/conversations`
- **Method:** `GET`
- **Auth required:** YES

#### Success Response
- **Code:** `200 OK`
- **Content:**
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "_id": "665a1b2c3d4e5f6a7b8c9d0e",
        "user": "651a2b3c4d5e6f7a8b9c0d1e",
        "title": "My Plant Query",
        "createdAt": "2026-06-01T12:00:00.000Z",
        "updatedAt": "2026-06-01T12:05:00.000Z"
      }
    ]
  }
  ```

---

### C. Get Single Conversation (with Messages)

Retrieve a conversation along with all its messages in chronological order.

- **URL:** `/chat/conversations/:id`
- **Method:** `GET`
- **Auth required:** YES

#### Success Response
- **Code:** `200 OK`
- **Content:**
  ```json
  {
    "success": true,
    "data": {
      "_id": "665a1b2c3d4e5f6a7b8c9d0e",
      "user": "651a2b3c4d5e6f7a8b9c0d1e",
      "title": "ما هي أعراض البياض الدقيقي؟",
      "messages": [
        {
          "_id": "665b...",
          "role": "user",
          "type": "text",
          "content": "ما هي أعراض البياض الدقيقي؟",
          "createdAt": "2026-06-01T12:01:00.000Z"
        },
        {
          "_id": "665c...",
          "role": "assistant",
          "type": "text",
          "content": "البياض الدقيقي يظهر على شكل...",
          "source": "llm",
          "metadata": { "...raw LLM response..." },
          "createdAt": "2026-06-01T12:01:02.000Z"
        }
      ]
    }
  }
  ```

---

### D. Update Conversation Title

- **URL:** `/chat/conversations/:id`
- **Method:** `PATCH`
- **Auth required:** YES
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "title": "Updated Title"
}
```

#### Success Response
- **Code:** `200 OK`

---

### E. Delete Conversation

Delete a conversation and all its messages.

- **URL:** `/chat/conversations/:id`
- **Method:** `DELETE`
- **Auth required:** YES

#### Success Response
- **Code:** `200 OK`
- **Content:**
  ```json
  {
    "success": true,
    "message": "Conversation deleted successfully"
  }
  ```

---

### F. Send Text Message (→ LLM)

Send a text question to the plant AI. The question and the AI response are both saved to the conversation.

- **URL:** `/chat/conversations/:id/text`
- **Method:** `POST`
- **Auth required:** YES
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "question": "ما هي أعراض البياض الدقيقي؟"
}
```

#### Success Response
- **Code:** `200 OK`
- **Content:**
  ```json
  {
    "success": true,
    "data": {
      "userMessage": {
        "_id": "...",
        "role": "user",
        "type": "text",
        "content": "ما هي أعراض البياض الدقيقي؟"
      },
      "assistantMessage": {
        "_id": "...",
        "role": "assistant",
        "type": "text",
        "content": "البياض الدقيقي يظهر على شكل...",
        "source": "llm",
        "metadata": { "...full LLM API response..." }
      }
    }
  }
  ```

#### Error Response
- **Code:** `502 Bad Gateway` (LLM service down)

---

### G. Send Image Message (→ CNN)

Upload a plant leaf image for disease detection. The image and the CNN results are both saved to the conversation.

- **URL:** `/chat/conversations/:id/image`
- **Method:** `POST`
- **Auth required:** YES
- **Headers:** `Content-Type: multipart/form-data`
- **Body:** Form field `file` containing the image

#### cURL Example
```bash
curl -X POST "http://localhost:5001/api/chat/conversations/CONVERSATION_ID/image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@leaf.jpg"
```

#### Success Response
- **Code:** `200 OK`
- **Content:**
  ```json
  {
    "success": true,
    "data": {
      "userMessage": {
        "_id": "...",
        "role": "user",
        "type": "image",
        "imageUrl": "data:image/jpeg;base64,..."
      },
      "assistantMessage": {
        "_id": "...",
        "role": "assistant",
        "type": "text",
        "content": "🌿 Disease Detection Results:\nTomato Late Blight: 98.5%",
        "source": "cnn",
        "metadata": { "...full CNN API response..." }
      }
    }
  }
  ```

#### Error Response
- **Code:** `502 Bad Gateway` (CNN service down)
