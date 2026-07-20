export const CITY_RESOLVER = Symbol('CITY_RESOLVER');

export interface ICityResolver {
  /** Serbest metin şehir adını (örn. "samsun", "İSTANBUL") cities tablosundaki id'ye çözer. */
  resolveByName(cityName: string): Promise<string | null>;
}
