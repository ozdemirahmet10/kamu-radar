'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  Database,
  Download,
  History,
  KeyRound,
  Landmark,
  ListChecks,
  Mail,
  MessageCircleQuestion,
  ShieldCheck,
  Trash2,
  UserCog,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';

const SUPPORT_EMAIL = 'destek@kamuradar.com';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqGroup {
  title: string;
  items: FaqItem[];
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    title: 'Hesap & Profil',
    items: [
      {
        question: 'KPSS puanımı nereye giriyorum?',
        answer:
          'Profilim sayfasından puan türünüzü (P3, P93 vb.) ve puanınızı girebilirsiniz. Bu bilgi, size uygun ilanların hesaplanmasında kullanılır.',
      },
      {
        question: 'Tercih ettiğim şehirleri nasıl eklerim?',
        answer:
          'Profilim sayfasında "Tercih Edilen Şehirler" bölümünden birden fazla şehir seçebilirsiniz. Bu tercih, eşleştirme sırasında dikkate alınır.',
      },
      {
        question: 'Mezuniyet bilgim neden önemli?',
        answer:
          'Bazı ilanlar belirli bölüm mezunlarını veya nitelik kodlarını şart koşar. Mezuniyet bölümünüzü doğru girmeniz, uygunluk hesaplamasının doğru çalışması için gereklidir.',
      },
    ],
  },
  {
    title: 'Eşleştirme Nasıl Çalışır',
    items: [
      {
        question: '"Başvurulabilir", "Bazı Şartlar Eksik", "Başvurulamaz" ne anlama geliyor?',
        answer:
          '"Başvurulabilir" (Uygun): profilinizle ilanın tüm şartları örtüşüyor. "Bazı Şartlar Eksik" (Kısmen Uygun): çoğu şart uyuyor ama bir-iki kriter (örn. yaş, deneyim) eksik olabilir. "Başvurulamaz" (Uygun Değil): temel şartlardan biri (puan türü, puan, bölüm vb.) örtüşmüyor.',
      },
      {
        question: 'Uygunluk yüzdesi nasıl hesaplanıyor?',
        answer:
          'Sistem, ilanın gerektirdiği kriterlerin (puan türü, minimum puan, şehir, eğitim düzeyi, yaş, deneyim, nitelik kodu vb.) kaçının profilinizle örtüştüğünü hesaplar ve bunu yüzdeye çevirir.',
      },
      {
        question: '"Bana Uygun İlanlar" ile "Tüm İlanlar" sayfası arasındaki fark ne?',
        answer:
          '"Bana Uygun İlanlar" yalnızca tam uygun olduğunuz (Başvurulabilir) ilanları gösterir. "Tüm İlanlar" ise sisteme kayıtlı tüm ilanları, uygunluk durumu fark etmeksizin listeler ve filtreleyebilmenizi sağlar.',
      },
    ],
  },
  {
    title: 'Bildirimler',
    items: [
      {
        question: 'Tarayıcı bildirimlerini (push) nasıl açarım?',
        answer:
          'Ayarlar sayfasındaki "Tarayıcı Bildirimleri" seçeneğini açtığınızda tarayıcınız izin isteyecektir. İzin verdiğinizde yeni uygun ilan veya yaklaşan son başvuru tarihi bildirimleri anında gelir.',
      },
      {
        question: 'E-posta bildirimlerinde "Anlık" ve "Günlük Özet" farkı nedir?',
        answer:
          '"Anlık" seçildiğinde her yeni bildirim oluştuğunda ayrı bir e-posta gönderilir. "Günlük Özet" seçildiğinde ise gün içindeki tüm bildirimler tek bir e-postada, her sabah toplu olarak gönderilir.',
      },
      {
        question: 'Kurum takibi ne işe yarar?',
        answer:
          'Kurumlar sayfasından bir kurumu takip ettiğinizde, o kurum yeni bir ilan yayınladığında uygunluk durumunuzdan bağımsız olarak bildirim alırsınız.',
      },
    ],
  },
  {
    title: 'Favoriler & Başvurularım',
    items: [
      {
        question: 'Favoriler ile Başvurularım arasındaki fark ne?',
        answer:
          'Favoriler, ilgilendiğiniz ilanları daha sonra tekrar bakmak üzere işaretlemenizi sağlar. Başvurularım ise gerçekten başvuru yaptığınız ilanların sürecini (belge bekleniyor, incelemede, mülakat vb.) takip etmenize yarar.',
      },
      {
        question: 'Başvuru durumumu nasıl güncellerim?',
        answer:
          'Başvurularım sayfasında ilgili ilanın durumunu (Belge Bekleniyor, İncelemede, Mülakat, Kabul Edildi vb.) elle güncelleyebilir, not ekleyebilirsiniz.',
      },
    ],
  },
  {
    title: 'Gizlilik & Veri',
    items: [
      {
        question: 'Verilerimi nasıl indirebilirim?',
        answer:
          'Ayarlar sayfasındaki "Verilerimi İndir" butonuyla profilinize ait tüm verileri (profil, eşleşmeler, favoriler, başvurular, bildirimler) tek bir JSON dosyası olarak indirebilirsiniz. Bu, KVKK kapsamındaki veri taşınabilirliği hakkınızdır.',
      },
      {
        question: 'Hesabımı nasıl silerim?',
        answer:
          'Ayarlar sayfasının en altındaki "Hesabımı Sil" bölümünden şifrenizi girerek hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz ve tüm oturumlarınızı sonlandırır.',
      },
    ],
  },
];

interface GuideStep {
  title: string;
  description: string;
  href: string;
  icon: typeof ListChecks;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: 'Profilini Tamamla',
    description: 'KPSS puanınızı, mezuniyet bilginizi ve tercih ettiğiniz şehirleri girin.',
    href: '/dashboard/profil',
    icon: UserCog,
  },
  {
    title: '"Bana Uygun İlanlar" Sayfasına Bakın',
    description: 'Profilinize tam uyan ilanları burada görürsünüz — sistemin ana amacı budur.',
    href: '/dashboard/uygun-ilanlar',
    icon: ListChecks,
  },
  {
    title: 'İlgilendiğiniz Kurumları Takip Edin',
    description: 'Kurumlar sayfasından bir kurumu takip ederek yeni ilanlarından haberdar olun.',
    href: '/dashboard/kurumlar',
    icon: Landmark,
  },
  {
    title: 'Bildirim Tercihlerinizi Ayarlayın',
    description: 'Anlık mı yoksa günlük özet mi almak istediğinizi Ayarlar sayfasından seçin.',
    href: '/dashboard/ayarlar',
    icon: Bell,
  },
];

interface ShortcutLink {
  label: string;
  href: string;
  icon: typeof KeyRound;
}

const SHORTCUT_LINKS: ShortcutLink[] = [
  { label: 'Şifremi Değiştir', href: '/dashboard/ayarlar', icon: KeyRound },
  { label: 'Bildirim Tercihleri', href: '/dashboard/ayarlar', icon: Bell },
  { label: 'Hesap Güvenlik Geçmişi', href: '/dashboard/ayarlar', icon: History },
  { label: 'Verilerimi İndir', href: '/dashboard/ayarlar', icon: Download },
  { label: 'Hesabımı Sil', href: '/dashboard/ayarlar', icon: Trash2 },
];

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 py-3 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-slate-900"
      >
        {item.question}
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && <p className="mt-2 text-sm text-slate-500">{item.answer}</p>}
    </div>
  );
}

export default function HelpCenterPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <MessageCircleQuestion className="text-brand-600" size={22} />
            Yardım Merkezi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kamu Radar&apos;ı nasıl kullanacağınızla ilgili rehber, sık sorulan sorular ve destek
            bilgileri.
          </p>
        </div>

        <Card>
          <h2 className="text-base font-semibold text-slate-900">Nasıl Kullanılır</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {GUIDE_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.title}
                  href={step.href}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
                    {index + 1}
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <Icon size={15} className="text-brand-600" />
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{step.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900">Sık Sorulan Sorular</h2>
          <div className="mt-4 space-y-6">
            {FAQ_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group.title}
                </h3>
                <div className="mt-2">
                  {group.items.map((item) => (
                    <FaqAccordionItem key={item.question} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Database size={18} className="text-brand-600" />
              Platform Hakkında
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-500">
              <p>
                Kamu Radar, resmi kamu ilan kaynaklarını (Kamu İlan Portalı, ilan.gov.tr gibi)
                düzenli aralıklarla tarayarak ilanları otomatik olarak toplar ve profilinizle
                eşleştirir.
              </p>
              <p>
                İlan bilgileri kaynak sitelerden otomatik/yapay zeka destekli olarak çıkarılır.
                Nadiren hatalı veya eksik bilgi olabilir — başvuru yapmadan önce ilanın resmi
                kaynağındaki tam metnini kontrol etmeniz önerilir.
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Mail size={18} className="text-brand-600" />
              İletişim & Destek
            </h2>
            <div className="mt-3 space-y-3 text-sm text-slate-500">
              <p>
                Bir sorunla mı karşılaştınız veya öneriniz mi var? Bize e-posta ile ulaşabilirsiniz:
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"
              >
                <Mail size={14} />
                {SUPPORT_EMAIL}
              </a>
              <p className="flex items-start gap-1.5 pt-1">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-slate-400" />
                Bir ilanın size uygun önerilip önerilmediğini düşünüyorsanız, "Bana Uygun
                İlanlar" sayfasındaki 👍/👎 geri bildirim butonlarını kullanarak bize doğrudan
                bildirebilirsiniz.
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-base font-semibold text-slate-900">Hesap İşlemleri Kısayolları</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SHORTCUT_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <Icon size={16} className="text-brand-600" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
