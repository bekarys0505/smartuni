import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { UserRole, UserStatus } from '../../generated/prisma/enums';

export class UpdateUserRoleDto {
  @IsEnum(UserRole, {
    message: 'Рөл тек STUDENT, TEACHER немесе ADMIN болуы керек',
  })
  role: UserRole;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus, {
    message: 'Статус тек ACTIVE немесе BLOCKED болуы керек',
  })
  status: UserStatus;
}

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Пән атауы міндетті' })
  @Length(2, 150, { message: 'Пән атауы 2-ден 150 таңбаға дейін болуы керек' })
  name: string;

  @IsOptional()
  @IsString()
  @Length(2, 20, { message: 'Пән коды 2-ден 20 таңбаға дейін болуы керек' })
  code?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Сипаттама 500 таңбадан аспауы керек' })
  description?: string;
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Пән атауы бос болмауы керек' })
  @Length(2, 150)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}

export class UpdateAdminGroupDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  course?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  capacity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  semester?: number;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsString()
  lessonDay?: string;

  @IsOptional()
  @IsString()
  lessonTime?: string;

  @IsOptional()
  @IsString()
  classroom?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

