import { IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  worshipTypes?: string[];

  @IsOptional()
  @IsString()
  sermonStyle?: string;

  @IsOptional()
  @IsString()
  congregationType?: string;
}
