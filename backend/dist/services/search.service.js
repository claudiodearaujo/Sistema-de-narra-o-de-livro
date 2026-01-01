"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = search;
exports.getSuggestions = getSuggestions;
exports.getTrendingSearches = getTrendingSearches;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Prepare query for PostgreSQL tsquery
 * Converts user input to a proper tsquery format
 */
function prepareSearchQuery(query) {
    // Remove special characters and normalize
    const sanitized = query.trim().replace(/[^\w\sáéíóúàèìòùâêîôûãõç]/gi, '');
    // Split into words and join with & (AND operator)
    const words = sanitized.split(/\s+/).filter(w => w.length >= 2);
    if (words.length === 0)
        return '';
    // Use prefix matching (:*) for the last word (autocomplete effect)
    const tsqueryParts = words.map((word, index) => {
        if (index === words.length - 1) {
            return `${word}:*`;
        }
        return word;
    });
    return tsqueryParts.join(' & ');
}
/**
 * Perform global search across users, books, and posts
 * Uses PostgreSQL Full-Text Search for better relevance
 */
async function search(query, filters = {}) {
    const { type, limit = 10, page = 1, useFTS = true } = filters;
    const skip = (page - 1) * limit;
    // Sanitize query
    const sanitizedQuery = query.trim().replace(/[^\w\sáéíóúàèìòùâêîôûãõç]/gi, '');
    if (!sanitizedQuery || sanitizedQuery.length < 2) {
        return {
            query,
            results: { users: [], books: [], posts: [] },
            totals: { users: 0, books: 0, posts: 0 },
            pagination: { page, limit },
            searchMethod: 'like'
        };
    }
    // Determine which types to search
    const typesToSearch = type
        ? (Array.isArray(type) ? type : [type])
        : ['user', 'book', 'post'];
    const results = {
        users: [],
        books: [],
        posts: []
    };
    const totals = {
        users: 0,
        books: 0,
        posts: 0
    };
    let searchMethod = 'like';
    try {
        // Prepare tsquery for FTS
        const tsQuery = prepareSearchQuery(sanitizedQuery);
        if (useFTS && tsQuery) {
            searchMethod = 'fts';
            // Search Users with FTS
            if (typesToSearch.includes('user')) {
                const ftsResults = await searchUsersFTS(tsQuery, skip, limit);
                results.users = ftsResults.users;
                totals.users = ftsResults.total;
            }
            // Search Books with FTS
            if (typesToSearch.includes('book')) {
                const ftsResults = await searchBooksFTS(tsQuery, skip, limit);
                results.books = ftsResults.books;
                totals.books = ftsResults.total;
            }
            // Search Posts with FTS
            if (typesToSearch.includes('post')) {
                const ftsResults = await searchPostsFTS(tsQuery, skip, limit);
                results.posts = ftsResults.posts;
                totals.posts = ftsResults.total;
            }
        }
        else {
            // Fallback to ILIKE search
            if (typesToSearch.includes('user')) {
                const likeResults = await searchUsersLike(sanitizedQuery, skip, limit);
                results.users = likeResults.users;
                totals.users = likeResults.total;
            }
            if (typesToSearch.includes('book')) {
                const likeResults = await searchBooksLike(sanitizedQuery, skip, limit);
                results.books = likeResults.books;
                totals.books = likeResults.total;
            }
            if (typesToSearch.includes('post')) {
                const likeResults = await searchPostsLike(sanitizedQuery, skip, limit);
                results.posts = likeResults.posts;
                totals.posts = likeResults.total;
            }
        }
    }
    catch (error) {
        console.error('[SearchService] FTS error, falling back to LIKE:', error);
        searchMethod = 'like';
        // Fallback search
        if (typesToSearch.includes('user')) {
            const likeResults = await searchUsersLike(sanitizedQuery, skip, limit);
            results.users = likeResults.users;
            totals.users = likeResults.total;
        }
        if (typesToSearch.includes('book')) {
            const likeResults = await searchBooksLike(sanitizedQuery, skip, limit);
            results.books = likeResults.books;
            totals.books = likeResults.total;
        }
        if (typesToSearch.includes('post')) {
            const likeResults = await searchPostsLike(sanitizedQuery, skip, limit);
            results.posts = likeResults.posts;
            totals.posts = likeResults.total;
        }
    }
    return {
        query,
        results,
        totals,
        pagination: { page, limit },
        searchMethod
    };
}
/**
 * Full-Text Search for users
 */
async function searchUsersFTS(tsQuery, skip, limit) {
    const searchResults = await prisma_1.default.$queryRaw `
    SELECT 
      u.id,
      u.name,
      u.username,
      u.avatar,
      u.bio,
      u.is_verified,
      (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count,
      ts_rank(
        to_tsvector('portuguese', coalesce(u.name, '') || ' ' || coalesce(u.username, '') || ' ' || coalesce(u.bio, '')),
        to_tsquery('portuguese', ${tsQuery})
      ) as rank
    FROM users u
    WHERE to_tsvector('portuguese', coalesce(u.name, '') || ' ' || coalesce(u.username, '') || ' ' || coalesce(u.bio, ''))
          @@ to_tsquery('portuguese', ${tsQuery})
    ORDER BY rank DESC, follower_count DESC
    LIMIT ${limit} OFFSET ${skip}
  `;
    const countResult = await prisma_1.default.$queryRaw `
    SELECT COUNT(*) as count
    FROM users u
    WHERE to_tsvector('portuguese', coalesce(u.name, '') || ' ' || coalesce(u.username, '') || ' ' || coalesce(u.bio, ''))
          @@ to_tsquery('portuguese', ${tsQuery})
  `;
    return {
        users: searchResults.map(r => ({
            type: 'user',
            id: r.id,
            name: r.name,
            username: r.username,
            avatar: r.avatar,
            bio: r.bio,
            isVerified: r.is_verified,
            followerCount: Number(r.follower_count),
            rank: r.rank
        })),
        total: Number(countResult[0].count)
    };
}
/**
 * Full-Text Search for books
 */
async function searchBooksFTS(tsQuery, skip, limit) {
    const searchResults = await prisma_1.default.$queryRaw `
    SELECT 
      b.id,
      b.title,
      b.description,
      b.cover_url,
      b.author as author_name,
      u.id as user_id,
      u.name as user_name,
      u.username as user_username,
      u.avatar as user_avatar,
      (SELECT COUNT(*) FROM chapters WHERE book_id = b.id) as chapter_count,
      ts_rank(
        to_tsvector('portuguese', coalesce(b.title, '') || ' ' || coalesce(b.description, '') || ' ' || coalesce(b.author, '')),
        to_tsquery('portuguese', ${tsQuery})
      ) as rank
    FROM books b
    LEFT JOIN users u ON b.user_id = u.id
    WHERE to_tsvector('portuguese', coalesce(b.title, '') || ' ' || coalesce(b.description, '') || ' ' || coalesce(b.author, ''))
          @@ to_tsquery('portuguese', ${tsQuery})
    ORDER BY rank DESC, b.updated_at DESC
    LIMIT ${limit} OFFSET ${skip}
  `;
    const countResult = await prisma_1.default.$queryRaw `
    SELECT COUNT(*) as count
    FROM books b
    WHERE to_tsvector('portuguese', coalesce(b.title, '') || ' ' || coalesce(b.description, '') || ' ' || coalesce(b.author, ''))
          @@ to_tsquery('portuguese', ${tsQuery})
  `;
    return {
        books: searchResults.map(r => ({
            type: 'book',
            id: r.id,
            title: r.title,
            description: r.description,
            coverUrl: r.cover_url,
            genre: null,
            author: {
                id: r.user_id || '',
                name: r.user_name || r.author_name,
                username: r.user_username,
                avatar: r.user_avatar
            },
            chapterCount: Number(r.chapter_count),
            rank: r.rank
        })),
        total: Number(countResult[0].count)
    };
}
/**
 * Full-Text Search for posts
 */
async function searchPostsFTS(tsQuery, skip, limit) {
    const searchResults = await prisma_1.default.$queryRaw `
    SELECT 
      p.id,
      p.content,
      p.media_url,
      p.created_at,
      u.id as user_id,
      u.name as user_name,
      u.username as user_username,
      u.avatar as user_avatar,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      ts_rank(
        to_tsvector('portuguese', p.content),
        to_tsquery('portuguese', ${tsQuery})
      ) as rank
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE to_tsvector('portuguese', p.content) @@ to_tsquery('portuguese', ${tsQuery})
    ORDER BY rank DESC, p.created_at DESC
    LIMIT ${limit} OFFSET ${skip}
  `;
    const countResult = await prisma_1.default.$queryRaw `
    SELECT COUNT(*) as count
    FROM posts p
    WHERE to_tsvector('portuguese', p.content) @@ to_tsquery('portuguese', ${tsQuery})
  `;
    return {
        posts: searchResults.map(r => ({
            type: 'post',
            id: r.id,
            content: r.content,
            mediaUrl: r.media_url,
            createdAt: r.created_at,
            user: {
                id: r.user_id,
                name: r.user_name,
                username: r.user_username,
                avatar: r.user_avatar
            },
            likeCount: Number(r.like_count),
            commentCount: Number(r.comment_count),
            rank: r.rank
        })),
        total: Number(countResult[0].count)
    };
}
/**
 * ILIKE search for users (fallback)
 */
async function searchUsersLike(query, skip, limit) {
    const [users, count] = await Promise.all([
        prisma_1.default.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } },
                    { bio: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                bio: true,
                isVerified: true,
                _count: { select: { followers: true } }
            },
            orderBy: { name: 'asc' },
            skip,
            take: limit
        }),
        prisma_1.default.user.count({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } },
                    { bio: { contains: query, mode: 'insensitive' } }
                ]
            }
        })
    ]);
    return {
        users: users.map(u => ({
            type: 'user',
            id: u.id,
            name: u.name,
            username: u.username,
            avatar: u.avatar,
            bio: u.bio,
            isVerified: u.isVerified,
            followerCount: u._count.followers
        })),
        total: count
    };
}
/**
 * ILIKE search for books (fallback)
 */
async function searchBooksLike(query, skip, limit) {
    const [books, count] = await Promise.all([
        prisma_1.default.book.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { author: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                title: true,
                description: true,
                coverUrl: true,
                author: true,
                user: {
                    select: { id: true, name: true, username: true, avatar: true }
                },
                _count: { select: { chapters: true } }
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: limit
        }),
        prisma_1.default.book.count({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { author: { contains: query, mode: 'insensitive' } }
                ]
            }
        })
    ]);
    return {
        books: books.map(b => ({
            type: 'book',
            id: b.id,
            title: b.title,
            description: b.description,
            coverUrl: b.coverUrl,
            genre: null,
            author: b.user || { id: '', name: b.author, username: null, avatar: null },
            chapterCount: b._count.chapters
        })),
        total: count
    };
}
/**
 * ILIKE search for posts (fallback)
 */
async function searchPostsLike(query, skip, limit) {
    const [posts, count] = await Promise.all([
        prisma_1.default.post.findMany({
            where: {
                content: { contains: query, mode: 'insensitive' }
            },
            select: {
                id: true,
                content: true,
                mediaUrl: true,
                createdAt: true,
                user: {
                    select: { id: true, name: true, username: true, avatar: true }
                },
                _count: { select: { likes: true, comments: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma_1.default.post.count({
            where: {
                content: { contains: query, mode: 'insensitive' }
            }
        })
    ]);
    return {
        posts: posts.map(p => ({
            type: 'post',
            id: p.id,
            content: p.content,
            mediaUrl: p.mediaUrl,
            createdAt: p.createdAt,
            user: p.user,
            likeCount: p._count.likes,
            commentCount: p._count.comments
        })),
        total: count
    };
}
/**
 * Get search suggestions (autocomplete)
 */
async function getSuggestions(query, limit = 5) {
    if (!query || query.length < 2) {
        return { users: [], books: [] };
    }
    const sanitizedQuery = query.trim().replace(/[^\w\sáéíóúàèìòùâêîôûãõç]/gi, '');
    const [users, books] = await Promise.all([
        prisma_1.default.user.findMany({
            where: {
                OR: [
                    { name: { startsWith: sanitizedQuery, mode: 'insensitive' } },
                    { username: { startsWith: sanitizedQuery, mode: 'insensitive' } }
                ]
            },
            select: { name: true, username: true },
            take: limit
        }),
        prisma_1.default.book.findMany({
            where: {
                title: { startsWith: sanitizedQuery, mode: 'insensitive' }
            },
            select: { title: true },
            take: limit
        })
    ]);
    return {
        users: users.map(u => u.username || u.name),
        books: books.map(b => b.title)
    };
}
/**
 * Get trending searches (could be based on actual search history)
 */
async function getTrendingSearches() {
    // For now, return popular genres and some common terms
    // In a real implementation, this would track search history
    return [
        'fantasia',
        'romance',
        'ficção científica',
        'terror',
        'mistério',
        'aventura'
    ];
}
