import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGroupDto {
  @IsString({ message: 'Топ атауы мәтін болуы керек' })
  @IsNotEmpty({ message: 'Топ атауын енгізіңіз' })
  @MaxLength(100, { message: 'Топ атауы 100 таңбадан аспауы керек' })
  name: string;

  @IsString({ message: 'Пән ID мәтін болуы керек' })
  @IsNotEmpty({ message: 'Пәнді таңдаңыз' })
  subjectId: string;

  @Type(() => Number)
  @IsInt({ message: 'Курс бүтін сан болуы керек' })
  @Min(1, { message: 'Курс 1-ден кем болмауы керек' })
  @Max(6, { message: 'Курс 6-дан аспауы керек' })
  course: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Студенттер сыйымдылығы бүтін сан болуы керек' })
  @Min(1, { message: 'Сыйымдылық кемінде 1 болуы керек' })
  @Max(200, { message: 'Сыйымдылық 200-ден аспауы керек' })
  capacity?: number;

  @Type(() => Number)
  @IsInt({ message: 'Семестр бүтін сан болуы керек' })
  @Min(1, { message: 'Семестр 1 немесе 2 болуы керек' })
  @Max(2, { message: 'Семестр 1 немесе 2 болуы керек' })
  semester: number;

  @IsString({ message: 'Оқу жылы мәтін болуы керек' })
  @IsNotEmpty({ message: 'Оқу жылын енгізіңіз' })
  @MaxLength(50, { message: 'Оқу жылы 50 таңбадан аспауы керек' })
  academicYear: string;

  @IsOptional()
  @IsString({ message: 'Сабақ күні мәтін болуы керек' })
  @MaxLength(50, { message: 'Сабақ күні 50 таңбадан аспауы керек' })
  lessonDay?: string;

  @IsOptional()
  @IsString({ message: 'Сабақ уақыты мәтін болуы керек' })
  @MaxLength(50, { message: 'Сабақ уақыты 50 таңбадан аспауы керек' })
  lessonTime?: string;

  @IsOptional()
  @IsString({ message: 'Аудитория мәтін болуы керек' })
  @MaxLength(50, { message: 'Аудитория 50 таңбадан аспауы керек' })
  classroom?: string;

  @IsOptional()
  @IsString({ message: 'Статус мәтін болуы керек' })
  @IsIn(['ACTIVE', 'ARCHIVED'], { message: 'Статус тек ACTIVE немесе ARCHIVED бола алады' })
  status?: string;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString({ message: 'Топ атауы мәтін болуы керек' })
  @IsNotEmpty({ message: 'Топ атауы бос болмауы керек' })
  @MaxLength(100, { message: 'Топ атауы 100 таңбадан аспауы керек' })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Курс бүтін сан болуы керек' })
  @Min(1, { message: 'Курс 1-ден кем болмауы керек' })
  @Max(6, { message: 'Курс 6-дан аспауы керек' })
  course?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Студенттер сыйымдылығы бүтін сан болуы керек' })
  @Min(1, { message: 'Сыйымдылық кемінде 1 болуы керек' })
  @Max(200, { message: 'Сыйымдылық 200-ден аспауы керек' })
  capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Семестр бүтін сан болуы керек' })
  @Min(1, { message: 'Семестр 1 немесе 2 болуы керек' })
  @Max(2, { message: 'Семестр 1 немесе 2 болуы керек' })
  semester?: number;

  @IsOptional()
  @IsString({ message: 'Оқу жылы мәтін болуы керек' })
  @IsNotEmpty({ message: 'Оқу жылы бос болмауы керек' })
  @MaxLength(50, { message: 'Оқу жылы 50 таңбадан аспауы керек' })
  academicYear?: string;

  @IsOptional()
  @IsString({ message: 'Сабақ күні мәтін болуы керек' })
  @MaxLength(50, { message: 'Сабақ күні 50 таңбадан аспауы керек' })
  lessonDay?: string;

  @IsOptional()
  @IsString({ message: 'Сабақ уақыты мәтін болуы керек' })
  @MaxLength(50, { message: 'Сабақ уақыты 50 таңбадан аспауы керек' })
  lessonTime?: string;

  @IsOptional()
  @IsString({ message: 'Аудитория мәтін болуы керек' })
  @MaxLength(50, { message: 'Аудитория 50 таңбадан аспауы керек' })
  classroom?: string;

  @IsOptional()
  @IsString({ message: 'Статус мәтін болуы керек' })
  @IsIn(['ACTIVE', 'ARCHIVED'], { message: 'Статус тек ACTIVE немесе ARCHIVED бола алады' })
  status?: string;
}

