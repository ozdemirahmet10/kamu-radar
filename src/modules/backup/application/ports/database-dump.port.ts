export const DATABASE_DUMP_SERVICE = Symbol('DATABASE_DUMP_SERVICE');

export interface IDatabaseDumpService {
  /** Veritabanının tam yedeğini belirtilen dosya yoluna (pg_dump custom format) yazar. */
  dump(outputFilePath: string): Promise<void>;
}
