export const SOURCE_ADAPTER_REGISTRY = Symbol('SOURCE_ADAPTER_REGISTRY');

export interface ListingSummary {
  /** Kaynaktaki orijinal kimlik (dedup/güncelleme takibi için) */
  externalRef: string;
  /**
   * fetchDetailText için kullanılan iç bağlantı — bazı kaynaklarda (örn. SBB) bu URL
   * oturuma bağlı/rotasyonlu bir token içerir ve crawl sırasından sonra geçersiz olabilir.
   * Bu yüzden applicationUrl olarak kullanıcıya GÖSTERİLMEMELİDİR — onun yerine
   * stablePublicUrl kullanılır.
   */
  sourceUrl: string;
  /**
   * Kullanıcıya "Başvuru Yap" linki olarak gösterilebilecek, zamanla bozulmayan bağlantı
   * (örn. kaynağın ana ilan listesi sayfası). Kaynakta ilana özel kalıcı bir link yoksa
   * null bırakılır — kırık link göstermektense hiç link göstermemek tercih edilir.
   */
  stablePublicUrl: string | null;
  institutionName: string;
  listingText: string;
}

export interface DetailFetchResult {
  text: string;
  /** İlan orijinal olarak bir PDF ise ham byte'ları — arşivlenip kullanıcıya sunulabilir. */
  pdfBuffer: Buffer | null;
}

export interface ISourceAdapter {
  readonly adapterKey: string;

  /** Ucuz: sadece liste sayfasını çeker, detay sayfasına/PDF'e gitmez. */
  fetchListingSummaries(maxItems?: number): Promise<ListingSummary[]>;

  /** Pahalı: tek bir ilanın detayını (PDF/HTML) çeker ve çıkarım için ham metne çevirir. */
  fetchDetailText(listing: ListingSummary): Promise<DetailFetchResult>;
}

/** adapterKey -> ISourceAdapter eşlemesi (yeni kaynak eklemek = buraya bir kayıt eklemek) */
export type SourceAdapterRegistry = Map<string, ISourceAdapter>;
