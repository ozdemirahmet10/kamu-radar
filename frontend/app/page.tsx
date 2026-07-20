import Link from 'next/link';
import {
  Bell,
  Building2,
  Calendar,
  FileCheck,
  Heart,
  PlayCircle,
  Shield,
  Target,
  UserPlus,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { HeroMockup } from '@/components/marketing/hero-mockup';

const NAV_LINKS = [
  { href: '#ana-sayfa', label: 'Ana Sayfa' },
  { href: '#nasil-calisir', label: 'Nasıl Çalışır?' },
  { href: '#ozellikler', label: 'Özellikler' },
  { href: '#kurumlar', label: 'Kurumlar' },
  { href: '#sss', label: 'S.S.S.' },
];

const FEATURES = [
  {
    icon: <Shield size={22} />,
    title: 'BİNLERCE İLAN',
    description: 'Tüm kamu kurumlarının güncel ilanlarına tek platformdan erişin.',
  },
  {
    icon: <Target size={22} />,
    title: 'AKILLI EŞLEŞTİRME',
    description: 'KPSS puanınıza, mezuniyet bilgilerinize ve tercihlerinize göre size en uygun ilanları gösterir.',
  },
  {
    icon: <Bell size={22} />,
    title: 'ANINDA BİLDİRİM',
    description: 'Yeni ilanları, son başvuru tarihlerini ve önemli gelişmeleri kaçırmazsınız.',
  },
  {
    icon: <Calendar size={22} />,
    title: 'SON BAŞVURU TAKİBİ',
    description: 'Başvuru tarihlerini takip edin, takviminizden hatırlatma bildirimleri alın.',
  },
  {
    icon: <FileCheck size={22} />,
    title: 'KOLAY BAŞVURU',
    description: 'Gerekli belgeleri hazırlayın, başvurularınızı kolayca yönetin.',
  },
  {
    icon: <Shield size={22} />,
    title: 'GÜVENLİ PLATFORM',
    description: 'Kişisel verileriniz 256-bit SSL ile korunur, güvenliğiniz önceliğimizdir.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Profilinizi Oluşturun',
    description: 'Mezuniyet, KPSS puan türü, puanınız ve tercihlerinizi bir kez girin.',
  },
  {
    step: '02',
    title: 'Radar Sizin İçin Taramaya Başlasın',
    description: 'ÖSYM, Kariyer Kapısı, bakanlıklar ve belediyeler dahil onlarca kaynağı sürekli tarar.',
  },
  {
    step: '03',
    title: 'Size Uygun İlanları Anında Görün',
    description: 'Uygunluk durumunuz ve eksik şartlarınızla birlikte bildirim alın, başvurunuzu kaçırmayın.',
  },
];

const INSTITUTIONS = [
  { name: 'T.C. İçişleri Bakanlığı', openings: 12 },
  { name: 'T.C. Sağlık Bakanlığı', openings: 8 },
  { name: 'T.C. Orman Genel Müdürlüğü', openings: 6 },
  { name: 'Türkiye İş Kurumu', openings: 5 },
  { name: 'Üniversiteler', openings: 24 },
];

const FAQS = [
  {
    question: 'Kamu Radar ücretsiz mi?',
    answer: 'Temel özellikler (profil oluşturma, ilan takibi, bildirimler) ücretsizdir.',
  },
  {
    question: 'Hangi kurumların ilanlarını takip ediyorsunuz?',
    answer:
      'ÖSYM, Kariyer Kapısı, Resmi Gazete, bakanlıklar, valilikler, belediyeler ve üniversiteler dahil onlarca resmi kaynağı düzenli olarak tarıyoruz.',
  },
  {
    question: 'Verilerim güvende mi?',
    answer: 'Tüm veriler 256-bit SSL ile şifrelenir ve KVKK’ya uygun şekilde saklanır.',
  },
  {
    question: 'Başvuruyu Kamu Radar üzerinden mi yapıyorum?',
    answer:
      'Hayır, başvurular her zaman ilgili kurumun resmi başvuru sayfası üzerinden yapılır. Kamu Radar sizi doğru ilana ve başvuru linkine yönlendirir.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-brand-600"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline">Giriş Yap</Button>
            </Link>
            <Link href="/register">
              <Button>Ücretsiz Başla</Button>
            </Link>
          </div>
        </div>
      </header>

      <section id="ana-sayfa" className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-success-50 px-4 py-1.5 text-xs font-semibold text-success-700">
              <span className="h-1.5 w-1.5 rounded-full bg-success-600" />
              Türkiye&apos;nin En Akıllı Kamu İlan Platformu
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">
              KPSS Puanınıza Uygun Kamu İlanlarını Siz Aramayın,{' '}
              <span className="text-brand-600">KAMU RADAR</span> Takip Etsin.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-500">
              Profilinizi oluşturun, KPSS puanınıza ve mezuniyet bilgilerinize uygun ilanları anında
              görün. Başvuru tarihlerini kaçırmayın, kariyer fırsatlarını yakalayın.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register">
                <Button className="gap-2">
                  <UserPlus size={18} />
                  Ücretsiz Hesap Oluştur
                </Button>
              </Link>
              <a href="#nasil-calisir">
                <Button variant="outline" className="gap-2">
                  <PlayCircle size={18} />
                  Nasıl Çalışıyor?
                </Button>
              </a>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-3">
                <Avatar fullName="Ahmet Yılmaz" size="sm" className="ring-2 ring-white" />
                <Avatar fullName="Elif Kaya" size="sm" className="ring-2 ring-white" />
                <Avatar fullName="Mert Demir" size="sm" className="ring-2 ring-white" />
                <Avatar fullName="Zeynep Can" size="sm" className="ring-2 ring-white" />
              </div>
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-900">50.000+</span> kullanıcı bize güveniyor
              </p>
            </div>
          </div>
          <HeroMockup />
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/60" id="ozellikler">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-card">
                  {feature.icon}
                </span>
                <p className="mt-4 text-xs font-bold tracking-wide text-slate-900">{feature.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-14 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Heart size={16} className="text-brand-500" />
            50.000+ kullanıcı doğru ilana, doğru zamanda ulaşmanın rahatlığını yaşıyor.
          </p>
        </div>
      </section>

      <section id="nasil-calisir" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">Nasıl Çalışır?</h2>
          <p className="mt-3 text-sm text-slate-500">
            Üç adımda size özel bir kariyer asistanına sahip olun.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="rounded-2xl border border-slate-100 p-6 shadow-card">
              <span className="text-3xl font-bold text-brand-100">{item.step}</span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="kurumlar" className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-900">Takip Ettiğimiz Kurumlar</h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {INSTITUTIONS.map((institution) => (
              <div
                key={institution.name}
                className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-card"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Building2 size={22} />
                </span>
                <p className="text-sm font-semibold text-slate-900">{institution.name}</p>
                <p className="text-xs text-slate-500">{institution.openings} açık ilan</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sss" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-slate-900">Sıkça Sorulan Sorular</h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-slate-100 p-5 shadow-card open:shadow-md"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center">
          <Logo size="sm" />
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Kamu Radar. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
