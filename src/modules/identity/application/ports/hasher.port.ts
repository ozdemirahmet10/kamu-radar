export const HASHER_SERVICE = Symbol('HASHER_SERVICE');

export interface IHasherService {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}
