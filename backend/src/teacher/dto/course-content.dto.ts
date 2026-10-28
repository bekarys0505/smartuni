import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaterialType } from '../../generated/prisma/enums';

export class CreateTopicDto {
  @IsString({ message: 'Тақырып атауы мәтін болуы керек' })
  @IsNotEmpty({ message: 'Тақырып атауын енгізіңіз' })
  @MaxLength(200, { message: 'Тақырып атауы 200 таңбадан аспауы керек' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Сипаттама мәтін болуы керек' })
  @MaxLength(2000, { message: 'Сипаттама 2000 таңбадан аспауы керек' })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Реттік нөмір бүтін сан болуы керек' })
  @Min(1, { message: 'Реттік нөмір 1-ден кем болмауы керек' })
  order?: number;
}

export class UpdateTopicDto {
  @IsOptional()
  @IsString({ message: 'Тақырып атауы мәтін болуы керек' })
  @IsNotEmpty({ message: 'Тақырып атауы бос болмауы керек' })
  @MaxLength(200, { message: 'Тақырып атауы 200 таңбадан аспауы керек' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Сипаттама мәтін болуы керек' })
  @MaxLength(2000, { message: 'Сипаттама 2000 таңбадан аспауы керек' })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Реттік нөмір бүтін сан болуы керек' })
  @Min(1, { message: 'Реттік нөмір 1-ден кем болмауы керек' })
  order?: number;
}

export class ReorderTopicsDto {
  @IsArray({ message: 'Тақырыптар ID тізімі massiv түрінде берілуі керек' })
  @ArrayNotEmpty({ message: 'Тақырыптар тізімі бос болмауы керек' })
  @IsString({ each: true, message: 'Әрбір ID мәтін болуы керек' })
  topicIds: string[];
}

export class CreateMaterialDto {
  @IsString({ message: 'Материал атауы мәтін болуы керек' })
  @IsNotEmpty({ message: 'Материал атауын енгізіңіз' })
  @MaxLength(250, { message: 'Материал атауы 250 таңбадан аспауы керек' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Сипаттама мәтін болуы керек' })
  @MaxLength(2000, { message: 'Сипаттама 2000 таңбадан аспауы керек' })
  description?: string;

  @IsEnum(MaterialType, {
    message: 'Материал түрі LECTURE, VIDEO немесе ADDITIONAL_RESOURCE болуы керек',
  })
  type: MaterialType;

  @IsOptional()
  @IsString({ message: 'Материал контенті мәтін болуы керек' })
  contentText?: string;

  @IsOptional()
  @IsString({ message: 'Ресурс сілтемесі мәтін болуы керек' })
  contentUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Реттік нөмір бүтін сан болуы керек' })
  @Min(1, { message: 'Реттік нөмір 1-ден кем болмауы керек' })
  order?: number;
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsString({ message: 'Материал атауы мәтін болуы керек' })
  @IsNotEmpty({ message: 'Материал атауы бос болмауы керек' })
  @MaxLength(250, { message: 'Материал атауы 250 таңбадан аспауы керек' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Сипаттама мәтін болуы керек' })
  @MaxLength(2000, { message: 'Сипаттама 2000 таңбадан аспауы керек' })
  description?: string;

  @IsOptional()
  @IsEnum(MaterialType, {
    message: 'Материал түрі LECTURE, VIDEO немесе ADDITIONAL_RESOURCE болуы керек',
  })
  type?: MaterialType;

  @IsOptional()
  @IsString({ message: 'Материал контенті мәтін болуы керек' })
  contentText?: string;

  @IsOptional()
  @IsString({ message: 'Ресурс сілтемесі мәтін болуы керек' })
  contentUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Реттік нөмір бүтін сан болуы керек' })
  @Min(1, { message: 'Реттік нөмір 1-ден кем болмауы керек' })
  order?: number;
}

export class ReorderMaterialsDto {
  @IsArray({ message: 'Материалдар ID тізімі massiv түрінде берілуі керек' })
  @ArrayNotEmpty({ message: 'Материалдар тізімі бос болмауы керек' })
  @IsString({ each: true, message: 'Әрбір ID мәтін болуы керек' })
  materialIds: string[];
}

