# Fix: Chapters and Dialogues Not Loading

## Problem Description
When accessing book pages (e.g., `https://writer.livrya.com.br/book/bc1e2edb-2fe9-4e48-bb6c-64252a1c39ad`), chapters and dialogues (falas/speeches) were not being displayed in the interface.

## Root Cause Analysis

The issue was caused by a **field name mismatch** between the backend database schema and the frontend TypeScript interfaces:

### Database Schema (Backend)
- Uses `orderIndex` for sorting
- Returns raw Prisma objects

### Frontend TypeScript Interfaces
- Expects `order` field instead of `orderIndex`
- Expects computed fields: `wordCount`, `speechesCount`
- Expects boolean flags: `hasAudio`, `hasImage`, `hasAmbientAudio`

### Additional Issues Found
1. **Reorder API Parameter Mismatch**: Frontend sends `chapterIds`/`speechIds` but backend expects `orderedIds`
2. **Nested Chapters in Books**: Books endpoint returns chapters but without proper field transformation

## Solution Implemented

### 1. Added Transformation Layer in Controllers

Created transformation functions that map database fields to frontend-expected format:

#### Chapters Controller (`backend/src/controllers/chapters.controller.ts`)
```typescript
function transformChapter(chapter: any) {
    const { orderIndex, speeches, ...rest } = chapter;
    
    return {
        ...rest,
        order: orderIndex,                    // Map orderIndex → order
        wordCount: calculateWordCountFromSpeeches(speeches || []),
        speechesCount: speeches?.length || 0,
    };
}
```

Applied to all chapter endpoints:
- `GET /api/books/:bookId/chapters` - List chapters
- `GET /api/chapters/:id` - Get single chapter
- `POST /api/books/:bookId/chapters` - Create chapter
- `PUT /api/chapters/:id` - Update chapter

#### Speeches Controller (`backend/src/controllers/speeches.controller.ts`)
```typescript
function transformSpeech(speech: any) {
    const { orderIndex, ...rest } = speech;
    
    return {
        ...rest,
        order: orderIndex,                        // Map orderIndex → order
        hasAudio: !!speech.audioUrl,             // Computed boolean
        hasImage: !!speech.sceneImageUrl,        // Computed boolean
        hasAmbientAudio: !!speech.ambientAudioUrl, // Computed boolean
        tags: [],                                 // TODO: Parse from ssmlText
    };
}
```

Applied to all speech endpoints:
- `GET /api/chapters/:chapterId/speeches` - List speeches
- `GET /api/speeches/:id` - Get single speech
- `POST /api/chapters/:chapterId/speeches` - Create speech
- `PUT /api/speeches/:id` - Update speech
- `POST /api/chapters/:chapterId/speeches/bulk` - Bulk create

#### Books Controller (`backend/src/controllers/books.controller.ts`)
```typescript
function transformBook(book: any) {
    const { chapters, ...rest } = book;
    
    return {
        ...rest,
        chapters: chapters?.map(transformChapterSimple) || [],
    };
}
```

Applied to book endpoints:
- `GET /api/books` - List books
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Create book
- `PUT /api/books/:id` - Update book

### 2. Fixed Reorder API Parameter Mismatches

Made reorder endpoints accept both parameter names for backward compatibility:

#### Chapters Reorder
```typescript
// Accept both chapterIds (frontend) and orderedIds (legacy)
const { orderedIds, chapterIds } = req.body;
const ids = orderedIds || chapterIds;
```

#### Speeches Reorder
```typescript
// Accept both speechIds (frontend) and orderedIds (legacy)
const { orderedIds, speechIds } = req.body;
const ids = orderedIds || speechIds;
```

### 3. Created Shared Utility Functions

Extracted word counting logic to avoid duplication (`backend/src/utils/transform.utils.ts`):

```typescript
export function countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
}

export function calculateWordCountFromSpeeches(speeches: Array<{ text: string }>): number {
    if (!speeches || !Array.isArray(speeches)) return 0;
    
    return speeches.reduce((sum, speech) => {
        return sum + countWords(speech.text);
    }, 0);
}
```

## Files Modified

1. **backend/src/controllers/chapters.controller.ts**
   - Added `transformChapter()` function
   - Applied transformation to all endpoints

2. **backend/src/controllers/speeches.controller.ts**
   - Added `transformSpeech()` function
   - Applied transformation to all endpoints
   - Fixed reorder parameter names

3. **backend/src/controllers/books.controller.ts**
   - Added `transformBook()` and `transformChapterSimple()` functions
   - Applied transformation to all endpoints

4. **backend/src/utils/transform.utils.ts** (NEW)
   - Shared utility functions for word counting

## Testing Recommendations

### Manual Testing Steps
1. **Login** to the Writer Studio
2. **Access a book page** with existing chapters (e.g., `/book/bc1e2edb-2fe9-4e48-bb6c-64252a1c39ad`)
3. **Verify** that chapters are displayed in the left sidebar
4. **Click on a chapter** and verify speeches/dialogues load
5. **Create a new chapter** and verify it appears correctly
6. **Reorder chapters** by dragging and verify the order persists
7. **Edit a speech** and verify changes are saved and displayed

### API Testing
Test these endpoints directly:

```bash
# Get chapters for a book
GET /api/books/{bookId}/chapters

# Get speeches for a chapter  
GET /api/chapters/{chapterId}/speeches

# Get a specific book
GET /api/books/{bookId}
```

Verify responses include:
- `order` field instead of `orderIndex`
- `wordCount` and `speechesCount` on chapters
- `hasAudio`, `hasImage`, `hasAmbientAudio` on speeches

## Deployment Notes

### Database
- **No database changes required** ✅
- All transformations happen at the API layer
- Existing data will work immediately

### Backward Compatibility
- Reorder APIs accept both old and new parameter names
- No breaking changes to existing integrations

### Performance
- Minimal overhead from transformations (simple field mapping)
- Word count calculated from in-memory data (no extra queries)
- One additional query for chapter update (to get accurate counts)

## Rollback Plan

If issues arise, simply revert the 5 commits:
```bash
git revert HEAD~5..HEAD
git push
```

The database schema remains unchanged, so rollback is safe.

## Success Criteria

✅ Chapters display in the sidebar when viewing a book
✅ Speeches/dialogues load when clicking on a chapter
✅ Chapter statistics show correct word count and speech count
✅ Reordering chapters and speeches works correctly
✅ Creating new chapters and speeches works correctly
✅ No breaking changes to existing functionality

## Additional Notes

- The transformation approach was chosen to minimize changes
- Alternative would have been to change the frontend types, but that would require more extensive changes
- Future improvement: Add proper TypeScript interfaces instead of `any` types
- Future improvement: Consider caching word counts in database for better performance
