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
 * Perform global search across users, books, and posts
 */
async function search(query, filters = {}) {
    const { type, limit = 10, page = 1 } = filters;
    const skip = (page - 1) * limit;
    // Sanitize query for PostgreSQL full-text search
    const sanitizedQuery = query.trim().replace(/[^\w\s]/g, '');
    if (!sanitizedQuery || sanitizedQuery.length < 2) {
        return {
            query,
            results: { users: [], books: [], posts: [] },
            totals: { users: 0, books: 0, posts: 0 },
            pagination: { page, limit }
        };
    }
    // Create search patterns
    const likePattern = `%${sanitizedQuery}%`;
    const startsWithPattern = `${sanitizedQuery}%`;
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
    // Search Users
    if (typesToSearch.includes('user')) {
        const [users, userCount] = await Promise.all([
            prisma_1.default.user.findMany({
                where: {
                    OR: [
                        { name: { contains: sanitizedQuery, mode: 'insensitive' } },
                        { username: { contains: sanitizedQuery, mode: 'insensitive' } },
                        { bio: { contains: sanitizedQuery, mode: 'insensitive' } }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                    bio: true,
                    isVerified: true,
                    _count: {
                        select: { followers: true }
                    }
                },
                orderBy: [
                    // Prioritize username matches
                    { username: 'asc' }
                ],
                skip,
                take: limit
            }),
            prisma_1.default.user.count({
                where: {
                    OR: [
                        { name: { contains: sanitizedQuery, mode: 'insensitive' } },
                        { username: { contains: sanitizedQuery, mode: 'insensitive' } },
                        { bio: { contains: sanitizedQuery, mode: 'insensitive' } }
                    ]
                }
            })
        ]);
        results.users = users.map(user => ({
            type: 'user',
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio,
            isVerified: user.isVerified,
            followerCount: user._count.followers
        }));
        totals.users = userCount;
    }
    // Search Books
    if (typesToSearch.includes('book')) {
        const [books, bookCount] = await Promise.all([
            prisma_1.default.book.findMany({
                where: {
                    OR: [
                        { title: { contains: sanitizedQuery, mode: 'insensitive' } },
                        { description: { contains: sanitizedQuery, mode: 'insensitive' } },
                        { author: { contains: sanitizedQuery, mode: 'insensitive' } }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    coverUrl: true,
                    author: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true
                        }
                    },
                    _count: {
                        select: { chapters: true }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.default.book.count({
                where: {
                    OR: [
                        { title: { contains: sanitizedQuery, mode: 'insensitive' } },
                        { description: { contains: sanitizedQuery, mode: 'insensitive' } },
                        { author: { contains: sanitizedQuery, mode: 'insensitive' } }
                    ]
                }
            })
        ]);
        results.books = books.map(book => ({
            type: 'book',
            id: book.id,
            title: book.title,
            description: book.description,
            coverUrl: book.coverUrl,
            genre: null,
            author: book.user || { id: '', name: book.author, username: null, avatar: null },
            chapterCount: book._count.chapters
        }));
        totals.books = bookCount;
    }
    // Search Posts
    if (typesToSearch.includes('post')) {
        const [posts, postCount] = await Promise.all([
            prisma_1.default.post.findMany({
                where: {
                    content: { contains: sanitizedQuery, mode: 'insensitive' }
                },
                select: {
                    id: true,
                    content: true,
                    mediaUrl: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true
                        }
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.default.post.count({
                where: {
                    content: { contains: sanitizedQuery, mode: 'insensitive' }
                }
            })
        ]);
        results.posts = posts.map(post => ({
            type: 'post',
            id: post.id,
            content: post.content,
            mediaUrl: post.mediaUrl,
            createdAt: post.createdAt,
            user: post.user,
            likeCount: post._count.likes,
            commentCount: post._count.comments
        }));
        totals.posts = postCount;
    }
    return {
        query,
        results,
        totals,
        pagination: { page, limit }
    };
}
/**
 * Get search suggestions (autocomplete)
 */
async function getSuggestions(query, limit = 5) {
    if (!query || query.length < 2) {
        return { users: [], books: [] };
    }
    const sanitizedQuery = query.trim().replace(/[^\w\s]/g, '');
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
