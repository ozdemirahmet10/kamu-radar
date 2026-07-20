import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import {
  DetailFetchResult,
  ISourceAdapter,
  ListingSummary,
} from '../../application/ports/source-adapter.port';

const BASE_URL = 'https://kamuilan.sbb.gov.tr/';
const USER_AGENT =
  'KamuRadarBot/1.0 (+https://kamu-radar.com/bot; ilan-tarama; iletisim: destek@kamu-radar.com)';
const DEFAULT_MAX_ITEMS = 100;

/**
 * Kaynak: kamuilan.sbb.gov.tr (T.C. Cumhurbaşkanlığı Strateji ve Bütçe Başkanlığı).
 *
 * Site ASP.NET WebForms tabanlı; ilan listesi ana sayfada statik HTML olarak geliyor,
 * ancak detay sayfaları (ilanDetay.aspx?kod=...) yalnızca doğru bir Referer başlığıyla
 * erişilebiliyor (hotlink koruması) ve genellikle bir PDF ilan metni döndürüyor.
 *
 * Liste çekimi ucuzdur (tek istek); detay çekimi (PDF indirme + parse) pahalıdır.
 * Bu yüzden ikisi ayrı metodlara bölündü — orkestrasyon katmanı (RunCrawlForSourceUseCase)
 * yalnızca daha önce görmediğimiz ilanlar için fetchDetailText'i çağırır.
 *
 * ÖNEMLİ: Sitenin `ilanDetay.aspx?kod=...` bağlantısındaki `kod` değeri her sayfa
 * yüklemesinde DEĞİŞİYOR (rotasyonlu/oturuma bağlı bir token — kalıcı bir ilan kimliği
 * değil; canlı sitede doğrulandı). Bu yüzden dedup/externalRef için `kod` yerine,
 * sitenin liste sayfasında değişmeden kalan kurum adı + ilan metninden türetilen
 * kararlı bir hash kullanılır.
 */
@Injectable()
export class SbbKamuIlanAdapter implements ISourceAdapter {
  readonly adapterKey = 'sbb-kamuilan';
  private readonly logger = new Logger(SbbKamuIlanAdapter.name);

  async fetchListingSummaries(maxItems: number = DEFAULT_MAX_ITEMS): Promise<ListingSummary[]> {
    const homeResponse = await axios.get<string>(BASE_URL, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000,
    });

    const $ = cheerio.load(homeResponse.data);
    const entries = $('#nav2 a.xx')
      .map((_, el) => {
        const href = $(el).attr('href');
        const institutionName = $(el).find('p.alt_p1').first().text().trim();
        const listingText = $(el).find('p.alt_p2').first().text().replace(/\s+/g, ' ').trim();
        return href ? { href, institutionName, listingText } : null;
      })
      .get()
      .filter((entry): entry is { href: string; institutionName: string; listingText: string } =>
        Boolean(entry),
      )
      .slice(0, maxItems);

    this.logger.log(`${entries.length} ilan bulundu (liste sayfasından).`);

    return entries.map((entry) => {
      const sourceUrl = new URL(entry.href, BASE_URL).toString();
      // Kararlı kimlik: sitenin rotasyonlu 'kod' token'ı yerine, liste sayfasında
      // sabit kalan içerikten (kurum adı + ilan metni) türetilen hash.
      const externalRef = createHash('sha256')
        .update(`${entry.institutionName}|${entry.listingText}`)
        .digest('hex');
      return {
        externalRef,
        sourceUrl,
        // Detay sayfasının 'kod' token'ı rotasyonlu olduğu için kalıcı değil (bkz. yukarıdaki
        // not) — kullanıcıya gösterilecek başvuru linki olarak sitenin ana ilan listesi
        // sayfası kullanılır, ilana özel kalıcı bir link sitede mevcut değil.
        stablePublicUrl: BASE_URL,
        institutionName: entry.institutionName,
        listingText: entry.listingText,
      };
    });
  }

  async fetchDetailText(listing: ListingSummary): Promise<DetailFetchResult> {
    let detailText = '';
    let pdfBuffer: Buffer | null = null;
    try {
      const detailResponse = await axios.get<ArrayBuffer>(listing.sourceUrl, {
        headers: { 'User-Agent': USER_AGENT, Referer: BASE_URL },
        responseType: 'arraybuffer',
        timeout: 15000,
      });

      const contentType = String(detailResponse.headers['content-type'] ?? '');
      const buffer = Buffer.from(detailResponse.data);

      if (contentType.includes('pdf')) {
        const parsed = await pdfParse(buffer);
        detailText = parsed.text;
        pdfBuffer = buffer;
      } else {
        const detailHtml = buffer.toString('utf-8');
        detailText = cheerio.load(detailHtml)('body').text().replace(/\s+/g, ' ').trim();
      }
    } catch (error) {
      this.logger.warn(`Detay alınamadı (${listing.institutionName}): ${(error as Error).message}`);
    }

    const text = [listing.institutionName, listing.listingText, detailText]
      .filter(Boolean)
      .join('\n\n');
    return { text, pdfBuffer };
  }
}
