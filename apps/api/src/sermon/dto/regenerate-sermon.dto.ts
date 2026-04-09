import { IsString, MaxLength } from 'class-validator';

export class RegenerateSermonDto {
  @IsString()
  @MaxLength(500)
  feedback: string;

  @IsString()
  targetSection: string; // FULL | INTRODUCTION | OUTLINE_1 | OUTLINE_2 | OUTLINE_3 | APPLICATION | CONCLUSION
}
