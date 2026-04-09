import {
  IsString,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateChurchDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  sizeCategory: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  worshipTypes: string[];

  @IsString()
  sermonStyle: string;

  @IsString()
  congregationType: string;
}
