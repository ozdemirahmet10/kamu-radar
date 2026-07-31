import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  DetailFetchResult,
  ISourceAdapter,
  ListingSummary,
} from '../../application/ports/source-adapter.port';

const BASE_URL = 'https://kariyerkapisi.gov.tr';
const API_BASE_URL = 'https://api.kariyerkapisi.gov.tr/api';
const RSS_URL = `${BASE_URL}/RSS`;
const USER_AGENT =
  'KamuRadarBot/1.0 (+https://kamu-radar.com/bot; ilan-tarama; iletisim: destek@kamu-radar.com)';
const DEFAULT_MAX_ITEMS = 100;
const MAX_PARENT_ILAN_SCANNED = 60;

interface IlanPreview {
  kurumAdi: string;
  ilanBaslik: string;
  ilanMetni: string;
  ilanTuru: string;
  basTarih: string;
  bitTarih: string;
}

interface KontenjanRow {
  il: string;
  kontenjan: number;
}

interface DegerlemeAsama {
  asamaAdi: string;
  turu: string;
  agirlik: number;
}

interface AltIlan {
  ilanBaslik: string;
  ilanMetni: string;
  unvan: string;
  kontenjanList: KontenjanRow[];
  degerlemeAsamaList: DegerlemeAsama[];
}

/** RSS'ten çekilen, henüz alt ilanlara ayrılmamış ham ilan özeti. */
interface RssEntry {
  ilanGuid: string;
  title: string;
  pubDate: string;
}

/** BBCode benzeri biçimlendirme etiketlerini ([justify][b][size=14pt] vb.) temizler. */
function stripBbCode(text: string): string {
  return text
    .replace(/\[\/?[a-z]+(=[^\]]*)?\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatTrDate(iso: string | null): string {
  if (!iso) return 'belirtilmemiş';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'belirtilmemiş';
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Kaynak: Kariyer Kapısı (kariyerkapisi.gov.tr — T.C. Cumhurbaşkanlığı'nın resmi merkezi
 * kamu personeli alım portalı). robots.txt yok (tamamen taranabilir).
 *
 * Aktif ilanların kimlikleri sitenin resmi RSS besleme özelliğinden (`/RSS`) alınır —
 * bu, kullanıcıya açık, kasıtlı olarak sunulan bir özellik, tersine mühendislik gerekmiyor.
 * Detay bilgisi ise SPA'nın kullandığı iki dahili REST uç noktasından (tarayıcı DevTools
 * ile tespit edildi) çekilir: `GetIlanPreviewPublic` (kurum/tarih bilgisi) ve
 * `GetAltIlanInfoByIlanIdPublic` (unvan bazlı alt ilanlar — kontenjan, gereksinim metni,
 * KPSS ağırlığı). Diğer kaynaklardan farklı olarak tek bir "ilan" birden fazla unvan/alt
 * ilan içerebiliyor — bu yüzden her alt ilan sistemde ayrı bir ilan kaydı olarak tutulur.
 */
@Injectable()
export class KariyerKapisiAdapter implements ISourceAdapter {
  readonly adapterKey = 'kariyer-kapisi';
  private readonly logger = new Logger(KariyerKapisiAdapter.name);

  async fetchListingSummaries(maxItems: number = DEFAULT_MAX_ITEMS): Promise<ListingSummary[]> {
    const rssEntries = await this.fetchRssEntries();
    this.logger.log(`${rssEntries.length} aktif ilan bulundu (RSS'ten).`);

    const summaries: ListingSummary[] = [];

    for (const entry of rssEntries.slice(0, MAX_PARENT_ILAN_SCANNED)) {
      if (summaries.length >= maxItems) break;

      try {
        const [preview, altIlanList] = await Promise.all([
          this.fetchIlanPreview(entry.ilanGuid),
          this.fetchAltIlanList(entry.ilanGuid),
        ]);

        const positions = altIlanList.length > 0 ? altIlanList : null;
        if (!positions) {
          this.logger.warn(`Alt ilan bulunamadı, atlanıyor: ${entry.ilanGuid}`);
          continue;
        }

        for (const [index, altIlan] of positions.entries()) {
          if (summaries.length >= maxItems) break;
          summaries.push(this.buildListingSummary(entry.ilanGuid, index, preview, altIlan));
        }
      } catch (error) {
        this.logger.warn(`İlan detayı alınamadı (${entry.ilanGuid}): ${(error as Error).message}`);
      }
    }

    return summaries;
  }

  async fetchDetailText(listing: ListingSummary): Promise<DetailFetchResult> {
    // Tüm gövde metni fetchListingSummaries sırasında zaten oluşturuldu (listingText) —
    // Kariyer Kapısı'nda bir ilanın alt ilanlarını numaralandırmak için zaten iki API
    // çağrısı gerekiyordu, bu yüzden detay metni de o sırada hazırlanıp burada tekrar
    // ağ isteği yapılmadan döndürülüyor. Kaynak PDF sunmuyor, pdfBuffer her zaman null.
    return { text: listing.listingText, pdfBuffer: null };
  }

  private async fetchRssEntries(): Promise<RssEntry[]> {
    const response = await axios.get<string>(RSS_URL, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, text/xml' },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const entries: RssEntry[] = [];

    $('item').each((_, element) => {
      const link = $(element).find('link').first().text().trim();
      const guidMatch = link.match(/[?&]i=([0-9a-fA-F-]{36})/);
      if (!guidMatch) return;

      entries.push({
        ilanGuid: guidMatch[1],
        title: $(element).find('title').first().text().trim(),
        pubDate: $(element).find('pubDate').first().text().trim(),
      });
    });

    return entries;
  }

  private async fetchIlanPreview(ilanGuid: string): Promise<IlanPreview> {
    const response = await axios.post<IlanPreview>(
      `${API_BASE_URL}/ilan/GetIlanPreviewPublic`,
      { ilanGuid },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
        timeout: 15000,
      },
    );
    return response.data;
  }

  private async fetchAltIlanList(ilanGuid: string): Promise<AltIlan[]> {
    const response = await axios.post<AltIlan[]>(
      `${API_BASE_URL}/altilan/GetAltIlanInfoByIlanIdPublic`,
      { ilanGuid },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
        timeout: 15000,
      },
    );
    return response.data ?? [];
  }

  private buildListingSummary(
    ilanGuid: string,
    index: number,
    preview: IlanPreview,
    altIlan: AltIlan,
  ): ListingSummary {
    const publicUrl = `${BASE_URL}/IlanDetay?i=${ilanGuid}`;
    const totalKontenjan = altIlan.kontenjanList.reduce((sum, row) => sum + row.kontenjan, 0);
    const kontenjanText = altIlan.kontenjanList
      .map((row) => `${row.il}: ${row.kontenjan} kişi`)
      .join(', ');
    const kpssAsama = altIlan.degerlemeAsamaList.find((asama) => asama.turu === 'KPSS');

    const textParts = [
      `Kurum: ${preview.kurumAdi}`,
      `İlan Başlığı: ${preview.ilanBaslik}`,
      `Unvan: ${altIlan.unvan}`,
      `Kontenjan: ${totalKontenjan > 0 ? `${totalKontenjan} kişi (${kontenjanText})` : 'belirtilmemiş'}`,
      `Başvuru Başlangıç Tarihi: ${formatTrDate(preview.basTarih)}`,
      `Başvuru Bitiş Tarihi: ${formatTrDate(preview.bitTarih)}`,
      kpssAsama ? `Değerlendirme: KPSS puan sırası (ağırlık %${kpssAsama.agirlik})` : null,
      `Genel Açıklama: ${stripBbCode(preview.ilanMetni)}`,
      `Aranan Şartlar: ${stripBbCode(altIlan.ilanMetni)}`,
    ].filter((part): part is string => Boolean(part));

    return {
      externalRef: `${ilanGuid}:${index}`,
      sourceUrl: publicUrl,
      stablePublicUrl: publicUrl,
      institutionName: preview.kurumAdi,
      listingText: textParts.join('\n'),
    };
  }
}
