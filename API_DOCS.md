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

## 3. How to use Protected Routes (For future use)

To access routes that require authentication (routes utilizing the `protect` middleware), you must include the JWT token in the `Authorization` header of your HTTP request.

- **Header Name:** `Authorization`
- **Header Value:** `Bearer YOUR_JWT_TOKEN_HERE`

Example using cURL:
```bash
curl -X GET http://localhost:5001/api/some-protected-route \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5c..."
```
