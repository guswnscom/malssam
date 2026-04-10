import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  getEvents(@Request() req: any, @Query('year') year: string, @Query('month') month: string) {
    return this.calendarService.getEvents(req.user.sub, parseInt(year) || new Date().getFullYear(), parseInt(month) || new Date().getMonth() + 1);
  }

  @Post('events')
  createEvent(@Request() req: any, @Body() body: any) {
    return this.calendarService.createEvent(req.user.sub, body);
  }

  @Put('events/:id')
  updateEvent(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.calendarService.updateEvent(req.user.sub, id, body);
  }

  @Delete('events/:id')
  deleteEvent(@Request() req: any, @Param('id') id: string) {
    return this.calendarService.deleteEvent(req.user.sub, id);
  }
}
