'use client';

import { useEffect, useState } from 'react';
import { Code2, Loader2, Pencil, Plus, PlayCircle } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { adminCrawlApi, CrawlSource, CrawlRun, CrawlSourcePayload } from '@/lib/api-client';

const STATUS_LABELS: Record<string, string> = {
  SUCCESS: 'Başarılı',
  FAILED: 'Hatalı',
  PARTIAL: 'Devam Ediyor / Kısmi',
};

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  SUCCESS: 'success',
  FAILED: 'danger',
  PARTIAL: 'warning',
};

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('tr-TR');
}

interface SourceFormState {
  name: string;
  baseUrl: string;
  adapterKey: string;
  crawlFrequencyCron: string;
  isActive: boolean;
}

const EMPTY_SOURCE_FORM: SourceFormState = {
  name: '',
  baseUrl: '',
  adapterKey: '',
  crawlFrequencyCron: '',
  isActive: true,
};

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

function SourceForm({
  form,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isEditing,
  adapterKeys,
}: {
  form: SourceFormState;
  onChange: (patch: Partial<SourceFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isEditing: boolean;
  adapterKeys: string[];
}) {
  const options = form.adapterKey && !adapterKeys.includes(form.adapterKey)
    ? [...adapterKeys, form.adapterKey]
    : adapterKeys;

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
      <h2 className="text-base font-semibold text-slate-900">
        {isEditing ? 'Kaynağı Düzenle' : 'Yeni Kaynak Ekle'}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Input
          label="Kaynak Adı"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Örn. Kariyer Kapısı"
        />
        <Input
          label="Adres (Base URL)"
          value={form.baseUrl}
          onChange={(e) => onChange({ baseUrl: e.target.value })}
          placeholder="https://..."
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Adapter Anahtarı</label>
          <select
            className={selectClass}
            value={form.adapterKey}
            onChange={(e) => onChange({ adapterKey: e.target.value })}
          >
            <option value="">Seçiniz</option>
            {options.map((key) => (
              <option key={key} value={key}>
                {key}
                {!adapterKeys.includes(key) ? ' (kodda kayıtlı değil)' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Yeni bir site için önce kodda yeni bir adapter yazılmalı — aksi halde tarama
            tetiklendiğinde &quot;adapter kayıtlı değil&quot; hatası alırsınız.
          </p>
        </div>
        <Input
          label="Zamanlama (cron ifadesi)"
          value={form.crawlFrequencyCron}
          onChange={(e) => onChange({ crawlFrequencyCron: e.target.value })}
          placeholder="Örn. 0 */6 * * *"
        />
        <div className="flex items-end pb-1">
          <Checkbox
            name="isActive"
            label="Aktif (otomatik zamanlamaya dahil edilsin)"
            checked={form.isActive}
            onChange={(e) => onChange({ isActive: e.target.checked })}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button onClick={onSave} isLoading={isSaving}>
          Kaydet
        </Button>
      </div>
    </div>
  );
}

function CrawlerMonitoringContent() {
  const { accessToken } = useAuth();
  const [sources, setSources] = useState<CrawlSource[]>([]);
  const [runs, setRuns] = useState<CrawlRun[]>([]);
  const [adapterKeys, setAdapterKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [triggerNotice, setTriggerNotice] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<'none' | 'create' | 'edit'>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SourceFormState>(EMPTY_SOURCE_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const [sourceList, runList, adapterList] = await Promise.all([
        adminCrawlApi.listSources(accessToken),
        adminCrawlApi.listRuns(accessToken),
        adminCrawlApi.listAdapters(accessToken),
      ]);
      setSources(sourceList);
      setRuns(runList);
      setAdapterKeys(adapterList.map((a) => a.adapterKey));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleTrigger = async (source: CrawlSource) => {
    if (!accessToken) return;
    setTriggeringId(source.id);
    setTriggerNotice(null);
    try {
      const result = await adminCrawlApi.trigger(source.id, accessToken);
      setTriggerNotice(
        `${source.name}: ${result.itemsFound} ilan bulundu, ${result.itemsNew} yeni, ${result.itemsSkipped} zaten mevcut, ${result.itemsFailed} hatalı.`,
      );
      await fetchData();
    } catch {
      setTriggerNotice(`${source.name}: tarama başlatılamadı.`);
    } finally {
      setTriggeringId(null);
    }
  };

  const openCreateForm = () => {
    setForm(EMPTY_SOURCE_FORM);
    setEditingId(null);
    setFormMode('create');
  };

  const openEditForm = (source: CrawlSource) => {
    setForm({
      name: source.name,
      baseUrl: source.baseUrl,
      adapterKey: source.adapterKey,
      crawlFrequencyCron: source.crawlFrequencyCron,
      isActive: source.isActive,
    });
    setEditingId(source.id);
    setFormMode('edit');
  };

  const closeForm = () => {
    setFormMode('none');
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!accessToken) return;
    if (!form.name.trim() || !form.baseUrl.trim() || !form.adapterKey.trim()) {
      setTriggerNotice('Kaynak adı, adres ve adapter anahtarı zorunludur.');
      return;
    }
    setIsSaving(true);
    try {
      const payload: CrawlSourcePayload = {
        name: form.name.trim(),
        baseUrl: form.baseUrl.trim(),
        adapterKey: form.adapterKey.trim(),
        crawlFrequencyCron: form.crawlFrequencyCron.trim(),
        isActive: form.isActive,
      };
      if (formMode === 'edit' && editingId) {
        await adminCrawlApi.update(editingId, payload, accessToken);
      } else {
        await adminCrawlApi.create(payload, accessToken);
      }
      closeForm();
      await fetchData();
    } catch {
      setTriggerNotice('Kaynak kaydedilemedi. Kaynak adının benzersiz olduğundan emin olun.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (source: CrawlSource) => {
    if (!accessToken) return;
    setTogglingId(source.id);
    try {
      await adminCrawlApi.update(source.id, { isActive: !source.isActive }, accessToken);
      await fetchData();
    } finally {
      setTogglingId(null);
    }
  };

  const sourceNameById = new Map(sources.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Crawler İzleme</h1>
          <p className="mt-1 text-sm text-slate-500">
            Otomatik tarama kaynaklarının durumunu izleyin, düzenleyin ve gerekirse manuel tetikleyin.
          </p>
        </div>
        {formMode === 'none' && (
          <Button className="gap-2" onClick={openCreateForm}>
            <Plus size={16} />
            Yeni Kaynak
          </Button>
        )}
      </div>

      <Card>
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Code2 size={18} className="text-brand-600" />
          Kodda Kayıtlı Adapter'lar
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Bir kaynağın taranabilmesi için adapter anahtarının burada listelenen değerlerden biri
          olması gerekir. Yeni bir site eklemek istediğinizde, önce o site için kodda yeni bir
          adapter yazılması gerekir — sadece kaynak eklemek yeterli değildir.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {adapterKeys.length === 0 ? (
            <span className="text-sm text-slate-400">Yükleniyor...</span>
          ) : (
            adapterKeys.map((key) => (
              <Badge key={key} variant="info" className="font-mono">
                {key}
              </Badge>
            ))
          )}
        </div>
      </Card>

      {formMode !== 'none' && (
        <SourceForm
          form={form}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          onSave={handleSave}
          onCancel={closeForm}
          isSaving={isSaving}
          isEditing={formMode === 'edit'}
          adapterKeys={adapterKeys}
        />
      )}

      {triggerNotice && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {triggerNotice}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-600" size={24} />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kaynak</th>
                  <th className="px-4 py-3">Adres</th>
                  <th className="px-4 py-3">Zamanlama (cron)</th>
                  <th className="px-4 py-3">Aktif</th>
                  <th className="px-4 py-3">Son Tarama</th>
                  <th className="px-4 py-3">Son Durum</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{source.name}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate-500">
                      {source.baseUrl}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {source.crawlFrequencyCron || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(source)}
                        disabled={togglingId === source.id}
                        className="disabled:opacity-50"
                      >
                        <Badge variant={source.isActive ? 'success' : 'neutral'}>
                          {source.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(source.lastCrawledAt)}</td>
                    <td className="px-4 py-3">
                      {source.lastStatus ? (
                        <Badge variant={STATUS_BADGE_VARIANT[source.lastStatus] ?? 'neutral'}>
                          {STATUS_LABELS[source.lastStatus] ?? source.lastStatus}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Henüz taranmadı</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="gap-1.5 px-3 py-1.5 text-xs"
                          onClick={() => openEditForm(source)}
                        >
                          <Pencil size={14} />
                          Düzenle
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-1.5 px-3 py-1.5 text-xs"
                          onClick={() => handleTrigger(source)}
                          isLoading={triggeringId === source.id}
                        >
                          <PlayCircle size={14} />
                          Şimdi Tara
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="mb-3 text-base font-semibold text-slate-900">Son Tarama Geçmişi</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              {runs.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">Henüz tarama kaydı yok.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Kaynak</th>
                      <th className="px-4 py-3">Başladı</th>
                      <th className="px-4 py-3">Bitti</th>
                      <th className="px-4 py-3">Durum</th>
                      <th className="px-4 py-3">Bulunan</th>
                      <th className="px-4 py-3">Yeni</th>
                      <th className="px-4 py-3">Hata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <tr key={run.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {sourceNameById.get(run.sourceId) ?? run.sourceId}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(run.startedAt)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(run.finishedAt)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_BADGE_VARIANT[run.status] ?? 'neutral'}>
                            {STATUS_LABELS[run.status] ?? run.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{run.itemsFound}</td>
                        <td className="px-4 py-3 text-slate-600">{run.itemsNew}</td>
                        <td className="max-w-[240px] truncate px-4 py-3 text-xs text-danger-600">
                          {run.errorMessage ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function CrawlerMonitoringPage() {
  return (
    <AdminShell>
      <CrawlerMonitoringContent />
    </AdminShell>
  );
}
