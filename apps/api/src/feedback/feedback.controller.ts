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

  // 최고관리자 전용: 특정 이메일만 접근 가능
  private static readonly SUPER_ADMIN_EMAILS = ['sioo0929@gmail.com'];

  private async checkSuperAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user || !FeedbackController.SUPER_ADMIN_EMAILS.includes(user.email)) {
      throw new ForbiddenException('최고관리자 권한이 필요합니다');
    }
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async getAllFeedbacks(@Request() req: any) {
    await this.checkSuperAdmin(req.user.sub);
    return this.feedbackService.getAllFeedbacks();
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getAdminStats(@Request() req: any) {
    await this.checkSuperAdmin(req.user.sub);
    return this.feedbackService.getAdminStats();
  }
}
