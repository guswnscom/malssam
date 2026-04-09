import { IsString, IsOptional, MaxLength, IsDateString } from 'class-validator';

export class GenerateSermonDto {
  @IsString()
  worshipType: string;

  @IsDateString()
  targetDate: string;

  @IsString()
  @MaxLength(100)
  scripture: string;

  @IsString()
  depth: string;

  @IsString()
  targetAudience: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialInstruction?: string;
}
