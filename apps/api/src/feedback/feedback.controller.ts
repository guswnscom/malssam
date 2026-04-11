import { Controller, Post, Get, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: any,
    @Body() dto: { category: string; rating: string; comment?: string; metadata?: any },
  ) {
    return this.feedbackService.createFeedback(req.user.sub, dto);
  }

  @Post('log')
  @UseGuards(JwtAuthGuard)
  async logUsage(
    @Request() req: any,
    @Body() dto: { action: string; metadata?: any },
  ) {
    await this.feedbackService.logUsage(req.user.sub, dto.action, dto.metadata);
    return { ok: true };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req: any) {
    return this.feedbackService.getUserStats(req.user.sub);
  }

  // 관리자 전용: 역할 체크
  private async checkAdmin(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active', role: { in: ['CHURCH_ADMIN', 'SENIOR_PASTOR'] } },
    });
    if (!membership) throw new ForbiddenException('관리자 권한이 필요합니다');
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async getAllFeedbacks(@Request() req: any) {
    await this.checkAdmin(req.user.sub);
    return this.feedbackService.getAllFeedbacks();
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getAdminStats(@Request() req: any) {
    await this.checkAdmin(req.user.sub);
    return this.feedbackService.getAdminStats();
  }
}
