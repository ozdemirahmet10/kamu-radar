'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/icons/google-icon';
import { AppleIcon } from '@/components/icons/apple-icon';

export function SocialLoginButtons() {
  const [notice, setNotice] = useState<string | null>(null);

  const handleComingSoon = (provider: string) => {
    setNotice(`${provider} ile giriş yakında aktif olacak.`);
    window.setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleComingSoon('Google')}
      >
        <GoogleIcon />
        Google ile devam et
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleComingSoon('Apple')}
      >
        <AppleIcon />
        Apple ile devam et
      </Button>
      {notice && <p className="text-center text-xs font-medium text-brand-600">{notice}</p>}
    </div>
  );
}
