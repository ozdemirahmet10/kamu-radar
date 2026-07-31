'use client';

import { useEffect } from 'react';
import { Megaphone } from 'lucide-react';

/**
 * Google AdSense reklam alanı. NEXT_PUBLIC_ADSENSE_CLIENT_ID ayarlanana kadar
 * gerçek reklam yerine "Bu alana reklam verebilirsiniz" yer tutucusu gösterir
 * — böylece alanların konumu görülebilir, ama gerçek kullanıcıya boş/kırık
 * bir AdSense kutusu gitmez.
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

  if (!clientId) {
    return (
      <div
        className={`flex min-h-[90px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center ${className ?? ''}`}
      >
        <Megaphone size={18} className="text-slate-300" />
        <p className="text-xs font-medium text-slate-400">Bu alana reklam verebilirsiniz</p>
      </div>
    );
  }

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
