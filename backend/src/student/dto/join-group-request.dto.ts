
import { IsString, IsNotEmpty } from 'class-validator';

export class JoinGroupRequestDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;
}

