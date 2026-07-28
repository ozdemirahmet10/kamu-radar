export const RAW_CONTENT_STORE = Symbol('RAW_CONTENT_STORE');

export interface RawContentStoreObject {
  key: string;
  lastModified: Date;
}

export interface IRawContentStore {
  /** Ham içeriği (HTML/PDF/metin) obje deposuna yazar ve depolama anahtarını döner. */
  store(key: string, content: string | Buffer, contentType?: string): Promise<string>;
  get(key: string): Promise<string | null>;
  /** İkili içeriği (örn. PDF) olduğu gibi okur — metne dönüştürmeden. */
  getBinary(key: string): Promise<Buffer | null>;
  /** Bir nesneyi depodan siler (örn. son başvuru tarihi geçen ilan PDF'i). */
  delete(key: string): Promise<void>;
  /** Obje deposuna erişilebiliyor mu kontrol eder (sistem sağlığı paneli için). */
  checkHealth(): Promise<boolean>;
  /** Belirtilen önekle başlayan tüm nesneleri listeler (örn. yedek dosyalarını budamak için). */
  listByPrefix(prefix: string): Promise<RawContentStoreObject[]>;
}
