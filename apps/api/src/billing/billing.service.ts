import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
      include: { church: { include: { subscription: true } } },
    });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');
    if (membership.role !== 'CHURCH_ADMIN') {
      throw new ForbiddenException('결제 관리는 교회 관리자만 가능합니다');
    }

    const sub = membership.church.subscription!;
    const now = new Date();
    const trialEnd = new Date(sub.trialEnd);
    const trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // 체험 만료 자동 처리
    let status = sub.status;
    if (status === 'trial' && trialDaysLeft <= 0) {
      status = 'expired';
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });
    }

    return {
      plan: sub.plan,
      status,
      trialStart: sub.trialStart,
      trialEnd: sub.trialEnd,
      trialDaysLeft,
      monthlyPrice: sub.monthlyPrice,
      cardLastFour: sub.cardLastFour,
      nextBillingDate: sub.nextBillingDate,
    };
  }

  async activate(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
      include: { church: { include: { subscription: true } } },
    });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');
    if (membership.role !== 'CHURCH_ADMIN') {
      throw new ForbiddenException('결제 관리는 교회 관리자만 가능합니다');
    }

    const sub = membership.church.subscription!;
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    const PLAN_PRICES: Record<string, number> = {
      SEED: 50000, GROWTH: 100000, FRUIT: 180000,
    };

    const updated = await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'active',
        billingStart: now,
        monthlyPrice: PLAN_PRICES[sub.plan] || 50000,
        nextBillingDate: nextBilling,
        cardLastFour: '4242', // 시뮬레이션
        cardBrand: 'VISA',
      },
    });

    return {
      plan: updated.plan,
      status: updated.status,
      monthlyPrice: updated.monthlyPrice,
      nextBillingDate: updated.nextBillingDate,
      cardLastFour: updated.cardLastFour,
    };
  }

  // 구독 상태 체크 (다른 서비스에서 호출)
  async checkAccess(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
      include: { church: { include: { subscription: true } } },
    });
    if (!membership) return { allowed: false, reason: '소속된 교회가 없습니다' };

    const sub = membership.church.subscription!;

    if (sub.status === 'active') return { allowed: true };

    if (sub.status === 'trial') {
      const trialEnd = new Date(sub.trialEnd);
      if (new Date() <= trialEnd) return { allowed: true };
      // 체험 만료
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });
      return { allowed: false, reason: '무료체험이 종료되었습니다. 구독을 시작해주세요.' };
    }

    return { allowed: false, reason: '구독이 만료되었습니다. 결제를 진행해주세요.' };
  }
}
