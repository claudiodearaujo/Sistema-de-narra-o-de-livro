# API Documentation

> Base URL: `http://localhost:3000/api`

## Getting Started

The API provides access to the Book Narration System resources. It follows RESTful principles and returns JSON responses.

### Authentication
Most endpoints require a valid JWT token.  
**Header**: `Authorization: Bearer <your_token>`

### Response Format

**Success:**
```json
{
  "id": "...",
  "title": "Book Title",
  ...
}
```

**Error:**
```json
{
  "error": "Error Summary",
  "message": "Detailed error message"
}
```

---

## Endpoints

### 📚 Books

#### List Books
`GET /books`
- **Auth**: Optional
- **Query Params**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `title`: Filter by title
  - `author`: Filter by author

#### Get Book Details
`GET /books/:id`
- **Auth**: Optional

#### Create Book
`POST /books`
- **Auth**: Required (Writer role)
- **Body**:
```json
{
  "title": "Book Title",
  "author": "Author Name",
  "coverImage": "url...",
  "description": "..."
}
```

#### Update Book
`PUT /books/:id`
- **Auth**: Required (Writer role, Owner)

#### Delete Book
`DELETE /books/:id`
- **Auth**: Required (Writer role, Owner)

---

### 📖 Chapters

#### List Chapters for Book
`GET /books/:bookId/chapters`
- **Auth**: Optional

#### Create Chapter
`POST /books/:bookId/chapters`
- **Auth**: Required (Writer role)
- **Body**:
```json
{
  "title": "Chapter 1",
  "content": "Chapter text content...",
  "orderIndex": 1
}
```

#### Get Chapter Details
`GET /chapters/:id`
- **Auth**: Optional

#### Reorder Chapters
`PUT /books/:bookId/chapters/reorder`
- **Auth**: Required (Writer role)
- **Body**: Array of chapter IDs in new order.

---

### 👤 Authentication

(See `auth.routes.ts` for full details)

#### Login
`POST /auth/login`
- **Body**: `{ "email": "...", "password": "..." }`

#### Register
`POST /auth/register`
- **Body**: `{ "name": "...", "email": "...", "password": "..." }`

---

## 🔒 Error Codes

- **400 Bad Request**: Invalid input or validation failure.
- **401 Unauthorized**: Missing or invalid token.
- **403 Forbidden**: Valid token but insufficient permissions.
- **404 Not Found**: Resource does not exist.
- **500 Internal Server Error**: Server-side processing error.
