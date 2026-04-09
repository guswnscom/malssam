import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChurchService } from './church.service';
import { CreateChurchDto } from './dto/create-church.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('churches')
@UseGuards(JwtAuthGuard)
export class ChurchController {
  constructor(private readonly churchService: ChurchService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateChurchDto) {
    return this.churchService.create(req.user.sub, dto);
  }

  @Get('me')
  getMyChurch(@Request() req: any) {
    return this.churchService.getMyChurch(req.user.sub);
  }

  @Put('me/profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.churchService.updateProfile(req.user.sub, dto);
  }
}
