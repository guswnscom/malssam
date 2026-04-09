import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('status')
  getStatus(@Request() req: any) {
    return this.billingService.getStatus(req.user.sub);
  }

  @Post('activate')
  activate(@Request() req: any) {
    return this.billingService.activate(req.user.sub);
  }
}
