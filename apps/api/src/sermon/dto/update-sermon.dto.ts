import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';

export class UpdateSermonDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() introduction?: string;
  @IsOptional() @IsArray() outline?: any[];
  @IsOptional() @IsString() application?: string;
  @IsOptional() @IsString() conclusion?: string;
}
