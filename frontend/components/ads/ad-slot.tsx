'use client';

import { useEffect } from 'react';

/**
 * Google AdSense reklam alanı. NEXT_PUBLIC_ADSENSE_CLIENT_ID ayarlanmadığı
 * sürece hiçbir şey render etmez — böylece gerçek AdSense hesabı onaylanana
 * kadar kullanıcıya boş/kırık bir reklam kutusu gösterilmez.
 *
 * Yerleşim kuralı: bu bileşen yalnızca ilan/eşleşme verisinin ALTINA veya
 * filtre panelinin altına konur — hiçbir zaman ilan listesinin arasına ya da
 * kullanıcının kendi verilerinin (profil, başvuru, bildirim) üzerine değil.
 */
export function AdSlot({ slot, className }: { slot: string; className?: string }) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    try {
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
        (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || [];
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({});
    } catch {
      // AdSense scripti henüz yüklenmemiş olabilir — sessizce yok say.
    }
  }, [clientId]);

  if (!clientId) return null;

  return (
    <ins
      className={`adsbygoogle block ${className ?? ''}`}
      style={{ display: 'block' }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
