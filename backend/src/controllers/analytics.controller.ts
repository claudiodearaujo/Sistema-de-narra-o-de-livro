import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export class AnalyticsController {
    /**
     * GET /api/analytics/author
     * Returns aggregated stats for the authenticated author
     */
    async getAuthorStats(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const [
                booksCount,
                chaptersCount,
                speechesCount,
                followersCount,
                likesCount,
                commentsCount,
                livraBalance
            ] = await Promise.all([
                prisma.book.count({ where: { userId } }),
                prisma.chapter.count({ where: { book: { userId } } }),
                prisma.speech.count({ where: { chapter: { book: { userId } } } }),
                prisma.follow.count({ where: { followingId: userId } }),
                prisma.like.count({ where: { post: { userId } } }),
                prisma.comment.count({ where: { post: { userId } } }),
                prisma.livraBalance.findUnique({ where: { userId } })
            ]);

            res.json({
                overview: {
                    works: {
                        books: booksCount,
                        chapters: chaptersCount,
                        speeches: speechesCount,
                    },
                    audience: {
                        followers: followersCount,
                    },
                    engagement: {
                        likes: likesCount,
                        comments: commentsCount,
                    },
                    earnings: {
                        lifetime: livraBalance?.lifetime || 0,
                        current: livraBalance?.balance || 0
                    }
                }
            });

        } catch (error: any) {
            console.error('[Analytics] Error fetching author stats:', error);
            res.status(500).json({ error: 'Failed to fetch analytics statistics.' });
        }
    }
}

export const analyticsController = new AnalyticsController();
