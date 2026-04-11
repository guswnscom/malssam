import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        authProvider: 'email',
      },
    });

    const tokens = await this.generateTokens(user.id);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      ...tokens,
    };
  }

  async login(dto: LoginDto & { keepLoggedIn?: boolean }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, dto.keepLoggedIn);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const tokens = await this.generateTokens(payload.sub);
      return tokens;
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: 'active' },
          include: { church: true },
          take: 1,
        },
      },
    });

    if (!user) throw new UnauthorizedException();

    const membership = user.memberships[0] || null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      churchId: membership?.churchId || null,
      churchName: membership?.church?.name || null,
      role: membership?.role || null,
    };
  }

  async findEmail(name: string) {
    const users = await this.prisma.user.findMany({
      where: {
        name: { contains: name },
      },
      select: { email: true, name: true, createdAt: true },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('해당 이름으로 가입된 계정이 없습니다');
    }

    // 이메일 마스킹: abc@gmail.com → a**@gmail.com
    return users.map(u => {
      const [local, domain] = u.email.split('@');
      const masked = local[0] + '*'.repeat(Math.max(local.length - 1, 2)) + '@' + domain;
      return { email: masked, name: u.name, createdAt: u.createdAt };
    });
  }

  // 1단계: 인증 코드 발급 (6자리)
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 보안: 이메일 존재 여부를 노출하지 않음
      return { message: '해당 이메일로 인증 코드가 발송되었습니다' };
    }

    // 기존 미사용 코드 무효화
    await this.prisma.passwordReset.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // 6자리 코드 생성 (10분 유효)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.passwordReset.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10분
      },
    });

    // TODO: 실제 이메일 발송 연동 시 여기에 추가
    // 베타 기간: 콘솔 로그로만 확인 (응답에 코드 노출 금지)
    console.log(`[PASSWORD RESET] email: ${email}, code: ${code}`);
    return { message: '해당 이메일로 인증 코드가 발송되었습니다' };
  }

  // 2단계: 코드 검증
  async verifyResetCode(email: string, code: string) {
    const record = await this.prisma.passwordReset.findFirst({
      where: { email, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new UnauthorizedException('인증 코드가 올바르지 않거나 만료되었습니다');
    }

    return { verified: true, resetId: record.id };
  }

  // 3단계: 비밀번호 변경 (코드 검증 후)
  async resetPassword(email: string, code: string, newPassword: string) {
    // 코드 재검증
    const record = await this.prisma.passwordReset.findFirst({
      where: { email, code, used: false, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      throw new UnauthorizedException('인증 코드가 올바르지 않거나 만료되었습니다');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('계정을 찾을 수 없습니다');
    }

    // 비밀번호 변경 + 코드 사용 처리 (트랜잭션)
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.passwordReset.update({ where: { id: record.id }, data: { used: true } }),
    ]);

    return { message: '비밀번호가 성공적으로 변경되었습니다' };
  }

  private async generateTokens(userId: string, keepLoggedIn = false) {
    const accessExpiry = keepLoggedIn ? '30d' : '1d';
    const refreshExpiry = keepLoggedIn ? '90d' : '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId },
        {
          secret: this.config.get('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get('JWT_ACCESS_EXPIRY') || accessExpiry,
        },
      ),
      this.jwt.signAsync(
        { sub: userId },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRY') || refreshExpiry,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
