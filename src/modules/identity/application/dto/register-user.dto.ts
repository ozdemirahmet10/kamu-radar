import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'aday@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'GucluBirSifre123!' })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  password!: string;

  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: '+905551234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
