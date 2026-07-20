import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Agent as HttpsAgent } from 'https';
import * as tls from 'tls';
import {
  DetailFetchResult,
  ISourceAdapter,
  ListingSummary,
} from '../../application/ports/source-adapter.port';

const BASE_URL = 'https://www.ilan.gov.tr';

// ilan.gov.tr, TLS handshake sırasında zincirindeki ara sertifikayı (GeoTrust TLS RSA CA
// G1, DigiCert Global Root G2'ye bağlanıyor — ikisi de standart/güvenilir) göndermiyor.
// Tarayıcılar ve Windows bunu otomatik tamamlıyor (AIA chasing) ama Node'un OpenSSL tabanlı
// doğrulaması sunucudan eksiksiz bir zincir bekliyor ve bu olmadan "unable to verify the
// first certificate" hatası veriyor. Kalıcı çözüm: eksik ara sertifikayı Node'un varsayılan
// kök listesine ekleyerek zinciri kendimiz tamamlıyoruz (sunucunun kendisi değiştirilemiyor).
const GEOTRUST_TLS_RSA_CA_G1_PEM = `-----BEGIN CERTIFICATE-----
MIIEjTCCA3WgAwIBAgIQDQd4KhM/xvmlcpbhMf/ReTANBgkqhkiG9w0BAQsFADBhMQswCQYDVQQG
EwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3d3cuZGlnaWNlcnQuY29tMSAw
HgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBHMjAeFw0xNzExMDIxMjIzMzdaFw0yNzExMDIx
MjIzMzdaMGAxCzAJBgNVBAYTAlVTMRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3
dy5kaWdpY2VydC5jb20xHzAdBgNVBAMTFkdlb1RydXN0IFRMUyBSU0EgQ0EgRzEwggEiMA0GCSqG
SIb3DQEBAQUAA4IBDwAwggEKAoIBAQC+F+jsvikKy/65LWEx/TMkCDIuWegh1Ngwvm4QyISgP7oU
5d79eoySG3vOhC3w/3jEMuipoH1fBtp7m0tTpsYbAhch4XA7rfuD6whUgajeErLVxoiWMPkC/DnU
vbgi74BJmdBiuGHQSd7LwsuXpTEGG9fYXcbTVN5SATYqDfbexbYxTMwVJWoVb6lrBEgM3gBBqiiA
iy800xu1Nq07JdCIQkBsNpFtZbIZhsDSfzlGWP4wEmBQ3O67c+ZXkFr2DcrXBEtHam80Gp2SNhou
2U5U7UesDL/xgLK6/0d76TnEVMSUVJkZ8VeZr+IUIlvoLrtjLbqugb0T3OYXW+CQU0kBAgMBAAGj
ggFAMIIBPDAdBgNVHQ4EFgQUlE/UXYvkpOKmgP792PkA76O+AlcwHwYDVR0jBBgwFoAUTiJUIBiV
5uNu5g/6+rkS7QYXjzkwDgYDVR0PAQH/BAQDAgGGMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEF
BQcDAjASBgNVHRMBAf8ECDAGAQH/AgEAMDQGCCsGAQUFBwEBBCgwJjAkBggrBgEFBQcwAYYYaHR0
cDovL29jc3AuZGlnaWNlcnQuY29tMEIGA1UdHwQ7MDkwN6A1oDOGMWh0dHA6Ly9jcmwzLmRpZ2lj
ZXJ0LmNvbS9EaWdpQ2VydEdsb2JhbFJvb3RHMi5jcmwwPQYDVR0gBDYwNDAyBgRVHSAAMCowKAYI
KwYBBQUHAgEWHGh0dHBzOi8vd3d3LmRpZ2ljZXJ0LmNvbS9DUFMwDQYJKoZIhvcNAQELBQADggEB
AIIcBDqC6cWpyGUSXAjjAcYwsK4iiGF7KweG97i1RJz1kwZhRoo6orU1JtBYnjzBc4+/sXmnHJk3
mlPyL1xuIAt9sMeC7+vreRIF5wFBC0MCN5sbHwhNN1JzKbifNeP5ozpZdQFmkCo+neBiKR6HqIA+
LMTMCMMuv2khGGuPHmtDze4GmEGZtYLyF8EQpa5YjPuV6k2Cr/N3XxFpT3hRpt/3usU/Zb9wfKPt
WpoznZ4/44c1p9rzFcZYrWkj3A+7TNBJE0GmP2fhXhP1D/XVfIW/h0yCJGEiV9Glm/uGOa3DXHlm
bAcxSyCRraG+ZBkA7h4SeM6Y8l/7MBRpPCz6l8Y=
-----END CERTIFICATE-----`;

const httpsAgent = new HttpsAgent({
  ca: [...tls.rootCertificates, GEOTRUST_TLS_RSA_CA_G1_PEM],
});
// Not: sitenin çalışma zamanı config'i (assets/appconfig.production.json) remoteServiceBaseUrl'i
// zaten ".../api" olarak veriyor; SPA servisi buna kendi başına bir "/api/services/app/..."
// daha ekliyor — bu yüzden gerçek istek yolu "/api/api/..." şeklinde (kaynakta doğrulandı).
const API_BASE_URL = `${BASE_URL}/api/api/services/app`;
const USER_AGENT =
  'KamuRadarBot/1.0 (+https://kamu-radar.com/bot; ilan-tarama; iletisim: destek@kamu-radar.com)';
const DEFAULT_MAX_ITEMS = 100;

/**
 * "Kamu Personel Alım ve Sınavları" taksonomi kimliği (taxId) — sitenin kendi kategori
 * ağacından doğrulandı: Kamu-Akademik Personel (taxId:8) > Kamu Personel Alım ve
 * Sınavları (taxId:44). "ats" (ad type) değeri 5 ise sitenin kendi filtre arayüzünde
 * kullandığı "PERSONEL ALIMI" ilan türü seçicisine karşılık geliyor.
 */
const CATEGORY_TAX_ID = 44;
const AD_TYPE_ID = 5;

interface AdSummary {
  id: string;
  title: string;
  advertiserName: string;
  addressCityName: string | null;
  publishStartDate: string;
  urlStr: string;
}

interface AdsByFilterResponse {
  result: { ads: AdSummary[]; numFound: number };
}

interface AdDetailResponse {
  result: { content: string | null };
}

/**
 * Kaynak: ilan.gov.tr (Basın İlan Kurumu — resmi ilan portalı).
 *
 * Site bir Angular SPA; ilan listesi/detayı sunucu tarafında HTML olarak gelmiyor,
 * tarayıcı JS ile bir ABP/.NET REST API'sine istek atıyor. Bu adapter aynı API'yi
 * doğrudan çağırıyor (tarayıcı olmadan). robots.txt sadece "/tebligat" yolunu
 * yasaklıyor — kullandığımız uç noktalar bunun dışında, açıkça izinli.
 *
 * SBB kaynağının aksine buradaki ilanlar PDF değil, zengin HTML metin olarak geliyor
 * (başvuru tarihi gibi alanlar da serbest metin içinde) — bu yüzden pdfBuffer her
 * zaman null döner, çıkarım tamamen ortak HybridExtractionService'e (regex+LLM) bırakılır.
 */
@Injectable()
export class IlanGovTrAdapter implements ISourceAdapter {
  readonly adapterKey = 'ilan-gov-tr';
  private readonly logger = new Logger(IlanGovTrAdapter.name);

  async fetchListingSummaries(maxItems: number = DEFAULT_MAX_ITEMS): Promise<ListingSummary[]> {
    // API, istenen maxResultCount ne olursa olsun sayfa başına en fazla 20 sonuç
    // döndürüyor (numFound gerçek toplamı doğru raporluyor) — bu yüzden tüm sonuçlara
    // ulaşmak için skipCount ile sayfalama yapılıyor.
    const ads: AdSummary[] = [];
    let skipCount = 0;

    while (ads.length < maxItems) {
      const response = await axios.post<AdsByFilterResponse>(
        `${API_BASE_URL}/Ad/AdsByFilter`,
        {
          keys: { txv: [CATEGORY_TAX_ID], ats: [AD_TYPE_ID] },
          skipCount,
          maxResultCount: maxItems - ads.length,
        },
        {
          headers: {
            'Content-Type': 'application/json-patch+json',
            Accept: 'text/plain',
            'User-Agent': USER_AGENT,
          },
          httpsAgent,
          timeout: 15000,
        },
      );

      const page = response.data.result.ads;
      ads.push(...page);
      skipCount += page.length;

      if (page.length === 0 || ads.length >= response.data.result.numFound) break;
    }

    this.logger.log(`${ads.length} ilan bulundu (liste API'sinden).`);

    return ads.map((ad) => ({
      externalRef: ad.id,
      sourceUrl: `${API_BASE_URL}/AdDetail/GetAdDetail?id=${ad.id}`,
      stablePublicUrl: `${BASE_URL}${ad.urlStr}`,
      institutionName: ad.advertiserName,
      listingText: ad.title,
    }));
  }

  async fetchDetailText(listing: ListingSummary): Promise<DetailFetchResult> {
    let detailText = '';
    try {
      const detailResponse = await axios.get<AdDetailResponse>(listing.sourceUrl, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain' },
        httpsAgent,
        timeout: 15000,
      });

      const html = detailResponse.data.result.content ?? '';
      detailText = cheerio.load(html)('body').text().replace(/\s+/g, ' ').trim();
    } catch (error) {
      this.logger.warn(`Detay alınamadı (${listing.institutionName}): ${(error as Error).message}`);
    }

    const text = [listing.institutionName, listing.listingText, detailText]
      .filter(Boolean)
      .join('\n\n');
    return { text, pdfBuffer: null };
  }
}
