import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AssessmentPeriod {
  RK1 = 'RK1',
  RK2 = 'RK2',
  SESSION = 'SESSION',
  ALL = 'ALL',
}

export class StudentGradeInputDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'РК-1 балы 0-ден кем болмауы керек' })
  @Max(100, { message: 'РК-1 балы 100-ден аспауы керек' })
  rk1?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'РК-2 балы 0-ден кем болмауы керек' })
  @Max(100, { message: 'РК-2 балы 100-ден аспауы керек' })
  rk2?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Сессия балы 0-ден кем болмауы керек' })
  @Max(100, { message: 'Сессия балы 100-ден аспауы керек' })
  session?: number | null;

  @IsOptional()
  @IsString()
  note?: string | null;
}

export class SaveTermGradesDto {
  @IsOptional()
  @IsEnum(AssessmentPeriod)
  period?: AssessmentPeriod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentGradeInputDto)
  grades: StudentGradeInputDto[];
}

