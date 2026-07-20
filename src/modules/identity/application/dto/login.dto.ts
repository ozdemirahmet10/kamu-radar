import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'aday@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'GucluBirSifre123!' })
  @IsString()
  password!: string;
}
