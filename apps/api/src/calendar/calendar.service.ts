import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvents(userId: string, year: number, month: number) {
    const membership = await this.prisma.membership.findFirst({ where: { userId, status: 'active' } });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // 해당 월 마지막 날

    const events = await this.prisma.churchEvent.findMany({
      where: {
        churchId: membership.churchId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
      include: { user: { select: { name: true } } },
    });

    // 절기 데이터도 함께 반환
    const liturgical = this.getLiturgicalEvents(year, month);

    return {
      events: events.map(e => ({
        id: e.id, title: e.title, date: e.date, endDate: e.endDate,
        eventType: e.eventType, worshipType: e.worshipType,
        needsSermon: e.needsSermon, sermonId: e.sermonId,
        scripture: e.scripture, description: e.description,
        reminderDays: e.reminderDays, color: e.color,
        isLiturgical: e.isLiturgical, authorName: e.user.name,
      })),
      liturgical,
    };
  }

  async createEvent(userId: string, data: any) {
    const membership = await this.prisma.membership.findFirst({ where: { userId, status: 'active' } });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');

    const event = await this.prisma.churchEvent.create({
      data: {
        churchId: membership.churchId,
        userId,
        title: data.title,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        eventType: data.eventType || 'CUSTOM',
        worshipType: data.worshipType || null,
        needsSermon: data.needsSermon || false,
        scripture: data.scripture || null,
        description: data.description || null,
        reminderDays: data.reminderDays || [],
        color: data.color || null,
      },
    });

    return event;
  }

  async updateEvent(userId: string, eventId: string, data: any) {
    const membership = await this.prisma.membership.findFirst({ where: { userId, status: 'active' } });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');

    const event = await this.prisma.churchEvent.findUnique({ where: { id: eventId } });
    if (!event || event.churchId !== membership.churchId) throw new ForbiddenException('접근 권한이 없습니다');

    return this.prisma.churchEvent.update({
      where: { id: eventId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.eventType && { eventType: data.eventType }),
        ...(data.worshipType !== undefined && { worshipType: data.worshipType }),
        ...(data.needsSermon !== undefined && { needsSermon: data.needsSermon }),
        ...(data.sermonId !== undefined && { sermonId: data.sermonId }),
        ...(data.scripture !== undefined && { scripture: data.scripture }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.reminderDays && { reminderDays: data.reminderDays }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
  }

  async deleteEvent(userId: string, eventId: string) {
    const membership = await this.prisma.membership.findFirst({ where: { userId, status: 'active' } });
    if (!membership) throw new NotFoundException('소속된 교회가 없습니다');

    const event = await this.prisma.churchEvent.findUnique({ where: { id: eventId } });
    if (!event || event.churchId !== membership.churchId) throw new ForbiddenException('접근 권한이 없습니다');

    await this.prisma.churchEvent.delete({ where: { id: eventId } });
    return { message: '일정이 삭제되었습니다' };
  }

  private getLiturgicalEvents(year: number, month: number) {
    const all = [
      { date: `${year}-01-01`, title: '신년', scripture: '여호수아 1:9', color: '#3B82F6' },
      { date: `${year}-02-18`, title: '사순절 시작', scripture: '이사야 53:3-5', color: '#7C3AED' },
      { date: `${year}-04-05`, title: '부활절', scripture: '고린도전서 15:3-8', color: '#F59E0B' },
      { date: `${year}-05-08`, title: '어버이주일', scripture: '출애굽기 20:12', color: '#EC4899' },
      { date: `${year}-05-24`, title: '성령강림절', scripture: '사도행전 2:1-4', color: '#EF4444' },
      { date: `${year}-06-25`, title: '6.25 기념주일', scripture: '시편 46:1-3', color: '#6B7280' },
      { date: `${year}-08-15`, title: '광복절', scripture: '갈라디아서 5:1', color: '#6B7280' },
      { date: `${year}-10-31`, title: '종교개혁주일', scripture: '로마서 1:17', color: '#F97316' },
      { date: `${year}-11-22`, title: '추수감사절', scripture: '시편 100편', color: '#F59E0B' },
      { date: `${year}-11-29`, title: '대림절 시작', scripture: '이사야 9:6', color: '#7C3AED' },
      { date: `${year}-12-25`, title: '성탄절', scripture: '누가복음 2:10-14', color: '#EF4444' },
    ];
    return all.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === month;
    });
  }
}
