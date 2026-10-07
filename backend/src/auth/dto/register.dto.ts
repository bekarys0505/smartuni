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

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Телефон нөмірі дұрыс емес',
  })
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'Құпиясөз кемінде 8 таңбадан тұруы және кем дегенде 1 бас әріп, 1 кіші әріп және 1 саннан құралуы керек',
  })
  password: string;

  // SmartUni университет өрістері
  @IsString()
  @IsNotEmpty()
  universityId: string;

  @IsString()
  @IsNotEmpty()
  facultyId: string;

  @IsString()
  @IsNotEmpty()
  majorId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  course?: number;
}