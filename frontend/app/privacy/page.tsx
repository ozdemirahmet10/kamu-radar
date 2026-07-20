import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/">
        <Logo />
      </Link>
      <h1 className="mt-10 text-2xl font-bold text-slate-900">Gizlilik Politikası</h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Kişisel verileriniz KVKK&apos;ya uygun şekilde işlenir ve saklanır. Detaylı gizlilik politikası
        metni hazırlanma aşamasındadır.
      </p>
    </div>
  );
}
