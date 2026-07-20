import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IHasherService } from '../../application/ports/hasher.port';

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptHasherService implements IHasherService {
  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
