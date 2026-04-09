import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChurchDto } from './dto/create-church.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ChurchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateChurchDto) {
    // 이미 교회 소속인지 확인
    const existing = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
    });
    if (existing) {
      throw new ConflictException('이미 교회에 소속되어 있습니다');
    }

    const inviteCode = randomBytes(5).toString('hex'); // 10자리
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 90);

    const church = await this.prisma.church.create({
      data: {
        name: dto.name,
        sizeCategory: dto.sizeCategory,
        inviteCode,
        inviteCodeExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        // 프로필
        profile: {
          create: {
            sermonStyle: dto.sermonStyle,
            congregationType: dto.congregationType,
            worshipTypes: dto.worshipTypes,
          },
        },
        // 구독 (무료체험)
        subscription: {
          create: {
            plan: 'SEED',
            status: 'trial',
            trialStart: now,
            trialEnd,
            maxPastors: 3,
            maxSermonsMonth: 20,
          },
        },
        // 멤버십 (CHURCH_ADMIN)
        memberships: {
          create: {
            userId,
            role: 'CHURCH_ADMIN',
          },
        },
        // 예배 일정
        worshipSchedules: {
          create: dto.worshipTypes.map((type) => ({
            type,
            name: this.getWorshipName(type),
            dayOfWeek: this.getDefaultDay(type),
          })),
        },
      },
      include: {
        profile: true,
        subscription: true,
        memberships: { where: { userId } },
      },
    });

    return {
      church: {
        id: church.id,
        name: church.name,
        inviteCode: church.inviteCode,
        sizeCategory: church.sizeCategory,
      },
      profile: {
        sermonStyle: church.profile!.sermonStyle,
        congregationType: church.profile!.congregationType,
        worshipTypes: church.profile!.worshipTypes,
      },
      subscription: {
        plan: church.subscription!.plan,
        status: church.subscription!.status,
        trialEnd: church.subscription!.trialEnd.toISOString().split('T')[0],
      },
      membership: {
        role: church.memberships[0].role,
      },
    };
  }

  async getMyChurch(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
      include: {
        church: {
          include: {
            profile: true,
            subscription: true,
            memberships: {
              where: { status: 'active' },
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('소속된 교회가 없습니다');
    }

    const church = membership.church;
    const sub = church.subscription!;
    const trialDaysLeft = Math.max(
      0,
      Math.ceil(
        (new Date(sub.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    );

    return {
      church: {
        id: church.id,
        name: church.name,
        inviteCode: church.inviteCode,
        sizeCategory: church.sizeCategory,
      },
      profile: {
        sermonStyle: church.profile!.sermonStyle,
        congregationType: church.profile!.congregationType,
        worshipTypes: church.profile!.worshipTypes,
      },
      subscription: {
        plan: sub.plan,
        status: sub.status,
        trialEnd: sub.trialEnd.toISOString().split('T')[0],
        trialDaysLeft,
      },
      membership: {
        role: membership.role,
      },
      members: church.memberships.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'active' },
    });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');

    const updated = await this.prisma.churchProfile.update({
      where: { churchId: membership.churchId },
      data: {
        ...(dto.sermonStyle && { sermonStyle: dto.sermonStyle }),
        ...(dto.congregationType && { congregationType: dto.congregationType }),
        ...(dto.worshipTypes && { worshipTypes: dto.worshipTypes }),
      },
    });

    return updated;
  }

  private getWorshipName(type: string): string {
    const map: Record<string, string> = {
      SUNDAY: '주일예배',
      WEDNESDAY: '수요예배',
      FRIDAY: '금요예배',
      DAWN: '새벽예배',
      SPECIAL: '특별예배',
    };
    return map[type] || type;
  }

  private getDefaultDay(type: string): number {
    const map: Record<string, number> = {
      SUNDAY: 0,
      WEDNESDAY: 3,
      FRIDAY: 5,
      DAWN: 1,
      SPECIAL: 6,
    };
    return map[type] ?? 0;
  }
}
