import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Қазіргі құпиясөзді енгізіңіз' })
  currentPassword: string;

  @IsString()
  @Length(8, 100, {
    message: 'Жаңа құпиясөз ұзындығы 8 таңбадан кем болмауы керек',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'Құпиясөз кемінде 8 таңбадан тұруы және кем дегенде 1 бас әріп, 1 кіші әріп және 1 саннан құралуы керек',
  })
  newPassword: string;
}

