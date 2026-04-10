import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(userId: string, dto: {
    category: string;
    rating: string;
    comment?: string;
    metadata?: any;
  }) {
    // churchId 조회
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
    });

    const feedback = await this.prisma.feedback.create({
      data: {
        userId,
        churchId: membership?.churchId || null,
        category: dto.category,
        rating: dto.rating,
        comment: dto.comment || null,
        metadata: dto.metadata || null,
      },
    });

    this.logger.log(`피드백 저장: ${dto.category} / ${dto.rating} (user: ${userId})`);
    return feedback;
  }

  async logUsage(userId: string, action: string, metadata?: any) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
    });

    await this.prisma.usageLog.create({
      data: {
        userId,
        churchId: membership?.churchId || null,
        action,
        metadata: metadata || null,
      },
    });
  }

  async getAllFeedbacks() {
    const feedbacks = await this.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // userId로 유저 이름 조회
    const userIds = [...new Set(feedbacks.map(f => f.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return feedbacks.map(f => ({
      ...f,
      userName: userMap.get(f.userId)?.name || '알 수 없음',
      userEmail: userMap.get(f.userId)?.email || '',
    }));
  }

  async getAdminStats() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalSermons, weeklyUsage, monthlyUsage, feedbackStats, recentFeedbacks] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.sermonDraft.count(),
      this.prisma.usageLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: weekAgo } },
        _count: true,
      }),
      this.prisma.usageLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: monthAgo } },
        _count: true,
      }),
      this.prisma.feedback.groupBy({
        by: ['rating'],
        _count: true,
      }),
      this.prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const weeklyMap: Record<string, number> = {};
    weeklyUsage.forEach(l => { weeklyMap[l.action] = l._count; });

    const monthlyMap: Record<string, number> = {};
    monthlyUsage.forEach(l => { monthlyMap[l.action] = l._count; });

    const ratingMap: Record<string, number> = {};
    feedbackStats.forEach(f => { ratingMap[f.rating] = f._count; });

    return {
      totalUsers,
      totalSermons,
      weeklyUsage: weeklyMap,
      monthlyUsage: monthlyMap,
      feedbackRatings: ratingMap,
      totalFeedbacks: feedbackStats.reduce((sum, f) => sum + f._count, 0),
    };
  }

  async getUserStats(userId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [weeklyLogs, monthlyLogs, recentLogs] = await Promise.all([
      this.prisma.usageLog.groupBy({
        by: ['action'],
        where: { userId, createdAt: { gte: weekAgo } },
        _count: true,
      }),
      this.prisma.usageLog.groupBy({
        by: ['action'],
        where: { userId, createdAt: { gte: monthAgo } },
        _count: true,
      }),
      this.prisma.usageLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { action: true, createdAt: true, metadata: true },
      }),
    ]);

    const weeklyMap: Record<string, number> = {};
    weeklyLogs.forEach(l => { weeklyMap[l.action] = l._count; });

    const monthlyMap: Record<string, number> = {};
    monthlyLogs.forEach(l => { monthlyMap[l.action] = l._count; });

    // 가장 많이 사용한 기능
    const topFeature = monthlyLogs.sort((a, b) => b._count - a._count)[0];

    return {
      weekly: weeklyMap,
      monthly: monthlyMap,
      recentActivity: recentLogs,
      topFeature: topFeature ? { action: topFeature.action, count: topFeature._count } : null,
    };
  }
}
