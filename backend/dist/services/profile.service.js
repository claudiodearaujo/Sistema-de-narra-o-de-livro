"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileByUsername = getProfileByUsername;
exports.getProfileById = getProfileById;
exports.updateProfile = updateProfile;
exports.getUserPosts = getUserPosts;
exports.getUserBooks = getUserBooks;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Get user profile by username
 */
async function getProfileByUsername(username, currentUserId) {
    const user = await prisma_1.default.user.findUnique({
        where: { username },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            bio: true,
            avatar: true,
            role: true,
            isVerified: true,
            createdAt: true,
            _count: {
                select: {
                    posts: true,
                    followers: true,
                    following: true,
                    books: true
                }
            }
        }
    });
    if (!user)
        return null;
    // Get total likes on user's posts
    const totalLikes = await prisma_1.default.like.count({
        where: {
            post: {
                userId: user.id
            }
        }
    });
    // Check if current user follows this user
    let isFollowing = false;
    let isFollowedBy = false;
    if (currentUserId && currentUserId !== user.id) {
        const [followingCheck, followedByCheck] = await Promise.all([
            prisma_1.default.follow.findFirst({
                where: {
                    followerId: currentUserId,
                    followingId: user.id
                }
            }),
            prisma_1.default.follow.findFirst({
                where: {
                    followerId: user.id,
                    followingId: currentUserId
                }
            })
        ]);
        isFollowing = !!followingCheck;
        isFollowedBy = !!followedByCheck;
    }
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        stats: {
            posts: user._count.posts,
            followers: user._count.followers,
            following: user._count.following,
            books: user._count.books,
            totalLikes
        },
        isFollowing,
        isFollowedBy
    };
}
/**
 * Get user profile by ID
 */
async function getProfileById(userId, currentUserId) {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            bio: true,
            avatar: true,
            role: true,
            isVerified: true,
            createdAt: true,
            _count: {
                select: {
                    posts: true,
                    followers: true,
                    following: true,
                    books: true
                }
            }
        }
    });
    if (!user)
        return null;
    // Get total likes on user's posts
    const totalLikes = await prisma_1.default.like.count({
        where: {
            post: {
                userId: user.id
            }
        }
    });
    // Check if current user follows this user
    let isFollowing = false;
    let isFollowedBy = false;
    if (currentUserId && currentUserId !== user.id) {
        const [followingCheck, followedByCheck] = await Promise.all([
            prisma_1.default.follow.findFirst({
                where: {
                    followerId: currentUserId,
                    followingId: user.id
                }
            }),
            prisma_1.default.follow.findFirst({
                where: {
                    followerId: user.id,
                    followingId: currentUserId
                }
            })
        ]);
        isFollowing = !!followingCheck;
        isFollowedBy = !!followedByCheck;
    }
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        stats: {
            posts: user._count.posts,
            followers: user._count.followers,
            following: user._count.following,
            books: user._count.books,
            totalLikes
        },
        isFollowing,
        isFollowedBy
    };
}
/**
 * Update user profile
 */
async function updateProfile(userId, input) {
    // If username is being changed, check availability
    if (input.username) {
        const existing = await prisma_1.default.user.findFirst({
            where: {
                username: input.username,
                NOT: { id: userId }
            }
        });
        if (existing) {
            throw new Error('Este nome de usuário já está em uso');
        }
    }
    const user = await prisma_1.default.user.update({
        where: { id: userId },
        data: {
            ...(input.name && { name: input.name }),
            ...(input.username && { username: input.username }),
            ...(input.bio !== undefined && { bio: input.bio }),
            ...(input.avatar !== undefined && { avatar: input.avatar })
        }
    });
    const profile = await getProfileById(userId);
    if (!profile) {
        throw new Error('Erro ao recuperar perfil atualizado');
    }
    return profile;
}
/**
 * Get user posts paginated
 */
async function getUserPosts(username, page = 1, limit = 20, currentUserId) {
    const user = await prisma_1.default.user.findUnique({
        where: { username },
        select: { id: true }
    });
    if (!user) {
        throw new Error('Usuário não encontrado');
    }
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
        prisma_1.default.post.findMany({
            where: { userId: user.id },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                },
                book: {
                    select: {
                        id: true,
                        title: true,
                        coverUrl: true
                    }
                },
                chapter: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        }),
        prisma_1.default.post.count({ where: { userId: user.id } })
    ]);
    // Check if current user liked each post
    let likedPostIds = new Set();
    if (currentUserId) {
        const likes = await prisma_1.default.like.findMany({
            where: {
                userId: currentUserId,
                postId: { in: posts.map(p => p.id) }
            },
            select: { postId: true }
        });
        likedPostIds = new Set(likes.map(l => l.postId));
    }
    const enrichedPosts = posts.map(post => ({
        id: post.id,
        userId: post.userId,
        type: post.type,
        content: post.content,
        mediaUrl: post.mediaUrl,
        bookId: post.bookId,
        chapterId: post.chapterId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: post.user,
        book: post.book,
        chapter: post.chapter,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        isLiked: likedPostIds.has(post.id)
    }));
    const totalPages = Math.ceil(total / limit);
    return {
        data: enrichedPosts,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages
        }
    };
}
/**
 * Get user books paginated
 */
async function getUserBooks(username, page = 1, limit = 20) {
    const user = await prisma_1.default.user.findUnique({
        where: { username },
        select: { id: true }
    });
    if (!user) {
        throw new Error('Usuário não encontrado');
    }
    const skip = (page - 1) * limit;
    const [books, total] = await Promise.all([
        prisma_1.default.book.findMany({
            where: { userId: user.id },
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: {
                        chapters: true
                    }
                }
            }
        }),
        prisma_1.default.book.count({ where: { userId: user.id } })
    ]);
    const enrichedBooks = books.map(book => ({
        id: book.id,
        title: book.title,
        description: book.description,
        coverUrl: book.coverUrl,
        author: book.author,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        chapterCount: book._count.chapters
    }));
    const totalPages = Math.ceil(total / limit);
    return {
        data: enrichedBooks,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages
        }
    };
}
