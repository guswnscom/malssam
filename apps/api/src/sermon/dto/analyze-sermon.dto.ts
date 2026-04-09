import { IsString, MinLength } from 'class-validator';

export class AnalyzeSermonDto {
  @IsString()
  @MinLength(100, { message: '최소 100자 이상의 설교문을 입력해주세요' })
  text: string;
}
