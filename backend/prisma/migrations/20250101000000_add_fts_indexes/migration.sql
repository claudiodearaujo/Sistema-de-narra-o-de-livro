-- PostgreSQL Full-Text Search Indexes
-- These GIN indexes significantly improve search performance
-- for the search.service.ts Full-Text Search functionality

-- Index for User search (name, username, bio)
CREATE INDEX IF NOT EXISTS idx_users_search ON users 
  USING GIN (to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(username, '') || ' ' || coalesce(bio, '')));

-- Index for Book search (title, description, author)
CREATE INDEX IF NOT EXISTS idx_books_search ON books 
  USING GIN (to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(author, '')));

-- Index for Post search (content)
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts 
  USING GIN (to_tsvector('portuguese', content));

-- Index for Chapter search (title, content) - for future use
CREATE INDEX IF NOT EXISTS idx_chapters_search ON chapters 
  USING GIN (to_tsvector('portuguese', coalesce(title, '') || ' ' || content));

-- Additional supporting indexes for common queries
-- These help with sorting and filtering in search results

-- Index for user follower count sorting
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Index for post engagement metrics
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Index for book chapter count
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);

-- Index for chronological sorting
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books(updated_at DESC);
