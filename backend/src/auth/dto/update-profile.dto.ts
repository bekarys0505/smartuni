import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Телефон нөмірі дұрыс емес',
  })
  phone?: string;

  // Teacher specific fields
  @IsOptional()
  @IsString()
  @Length(0, 150)
  department?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  position?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(70)
  experience?: number;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  // Student specific fields
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  course?: number;
}

