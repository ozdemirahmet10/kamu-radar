import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/">
        <Logo />
      </Link>
      <h1 className="mt-10 text-2xl font-bold text-slate-900">Kullanım Şartları</h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Kamu Radar platformunun kullanım şartları hazırlanma aşamasındadır. Bu sayfa, hukuki metinler
        tamamlandığında güncel içerikle yayınlanacaktır.
      </p>
    </div>
  );
}
