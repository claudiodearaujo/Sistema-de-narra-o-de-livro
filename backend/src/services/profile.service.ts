import { User, Post, Book, PostType } from '@prisma/client';
import prisma from '../lib/prisma';
import { auditService } from './audit.service';

/**
 * User profile with statistics
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  bio: string | null;
  avatar: string | null;
  role: string;
  isVerified: boolean;
  createdAt: Date;
  stats: {
    posts: number;
    followers: number;
    following: number;
    books: number;
    totalLikes: number;
  };
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}

/**
 * Profile update input
 */
export interface ProfileUpdateInput {
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Get user profile by username
 */
export async function getProfileByUsername(
  username: string,
  currentUserId?: string
): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
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

  if (!user) return null;

  // Get total likes on user's posts
  const totalLikes = await prisma.like.count({
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
      prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: user.id
        }
      }),
      prisma.follow.findFirst({
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
export async function getProfileById(
  userId: string,
  currentUserId?: string
): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
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

  if (!user) return null;

  // Get total likes on user's posts
  const totalLikes = await prisma.like.count({
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
      prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: user.id
        }
      }),
      prisma.follow.findFirst({
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
export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
  userEmail?: string
): Promise<UserProfile> {
  // If username is being changed, check availability
  if (input.username) {
    const existing = await prisma.user.findFirst({
      where: {
        username: input.username,
        NOT: { id: userId }
      }
    });

    if (existing) {
      throw new Error('Este nome de usuário já está em uso');
    }
  }

  // Get current profile for audit comparison
  const currentProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true, bio: true, avatar: true, email: true }
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.username && { username: input.username }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.avatar !== undefined && { avatar: input.avatar })
    }
  });

  // Audit log - profile updated
  if (userEmail || currentProfile?.email) {
    auditService.log({
      userId,
      userEmail: userEmail || currentProfile?.email || 'unknown',
      action: 'USER_UPDATE_PROFILE' as any,
      category: 'USER_MANAGEMENT' as any,
      severity: 'MEDIUM' as any,
      resource: 'User',
      resourceId: userId,
      description: `Perfil do usuário atualizado`,
      metadata: { 
        changes: Object.keys(input),
        before: {
          name: currentProfile?.name,
          username: currentProfile?.username,
          bio: currentProfile?.bio
        },
        after: {
          name: input.name,
          username: input.username,
          bio: input.bio
        }
      }
    }).catch(err => console.error('[AUDIT]', err));
  }

  const profile = await getProfileById(userId);
  if (!profile) {
    throw new Error('Erro ao recuperar perfil atualizado');
  }

  return profile;
}

/**
 * Get user posts paginated
 */
export async function getUserPosts(
  username: string,
  page: number = 1,
  limit: number = 20,
  currentUserId?: string
): Promise<PaginatedResponse<any>> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true }
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
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
    prisma.post.count({ where: { userId: user.id } })
  ]);

  // Check if current user liked each post
  let likedPostIds: Set<string> = new Set();
  if (currentUserId) {
    const likes = await prisma.like.findMany({
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
export async function getUserBooks(
  username: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<any>> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true }
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const skip = (page - 1) * limit;

  const [books, total] = await Promise.all([
    prisma.book.findMany({
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
    prisma.book.count({ where: { userId: user.id } })
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
