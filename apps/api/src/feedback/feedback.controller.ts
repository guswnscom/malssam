import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

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
}
