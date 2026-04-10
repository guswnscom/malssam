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

  async login(dto: LoginDto) {
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

    const tokens = await this.generateTokens(user.id);

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

  async resetPassword(email: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('해당 이메일로 가입된 계정이 없습니다');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: '비밀번호가 성공적으로 변경되었습니다' };
  }

  private async generateTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId },
        {
          secret: this.config.get('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get('JWT_ACCESS_EXPIRY') || '7d',
        },
      ),
      this.jwt.signAsync(
        { sub: userId },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRY') || '90d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
