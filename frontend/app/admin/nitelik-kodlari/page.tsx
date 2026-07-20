'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/dashboard/pagination';
import { useAuth } from '@/lib/auth-context';
import {
  adminQualificationCodesApi,
  graduationDepartmentsApi,
  AdminQualificationCode,
  AdminQualificationCodeStats,
  EducationLevel,
  EDUCATION_LEVEL_LABELS,
  GraduationDepartment,
  ProfileQualificationCode,
} from '@/lib/api-client';

const PAGE_SIZE = 20;

const selectClass =
  'rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

function AdminQualificationCodesContent() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<AdminQualificationCodeStats | null>(null);

  const [departmentLevel, setDepartmentLevel] = useState<EducationLevel | ''>('');
  const [departments, setDepartments] = useState<GraduationDepartment[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [departmentCodes, setDepartmentCodes] = useState<ProfileQualificationCode[] | null>(null);
  const [isLoadingDepartmentCodes, setIsLoadingDepartmentCodes] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [searchLevel, setSearchLevel] = useState<EducationLevel | ''>('');
  const [codes, setCodes] = useState<AdminQualificationCode[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingSearch, setIsLoadingSearch] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    adminQualificationCodesApi.stats(accessToken).then(setStats).catch(() => undefined);
  }, [accessToken]);

  useEffect(() => {
    if (!departmentLevel) {
      setDepartments([]);
      setSelectedDepartmentId('');
      return;
    }
    graduationDepartmentsApi.list(departmentLevel).then(setDepartments).catch(() => setDepartments([]));
  }, [departmentLevel]);

  const fetchDepartmentCodes = async (departmentId: string) => {
    if (!accessToken || !departmentId) {
      setDepartmentCodes(null);
      return;
    }
    setIsLoadingDepartmentCodes(true);
    try {
      const result = await adminQualificationCodesApi.byDepartment(departmentId, accessToken);
      setDepartmentCodes(result);
    } finally {
      setIsLoadingDepartmentCodes(false);
    }
  };

  const fetchCodes = async (targetPage: number) => {
    if (!accessToken) return;
    setIsLoadingSearch(true);
    try {
      const result = await adminQualificationCodesApi.search(
        {
          keyword: keyword || undefined,
          educationLevel: searchLevel || undefined,
          page: targetPage,
          pageSize: PAGE_SIZE,
        },
        accessToken,
      );
      setCodes(result.items);
      setPage(result.page);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchCodes(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nitelik Kodları</h1>
        <p className="mt-1 text-sm text-slate-500">
          ÖSYM nitelik kodu referans verisini inceleyin ve veri kalitesini kontrol edin.
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-2xl font-bold text-slate-900">{stats.totalCodes}</p>
            <p className="text-sm text-slate-500">Toplam Nitelik Kodu</p>
          </Card>
          <Card>
            <p className="text-2xl font-bold text-slate-900">{stats.totalDepartments}</p>
            <p className="text-sm text-slate-500">Toplam Bölüm</p>
          </Card>
          <Card>
            <div className="flex flex-wrap gap-3 text-sm">
              {Object.entries(stats.codesByLevel).map(([level, count]) => (
                <span key={level} className="text-slate-600">
                  <span className="font-semibold text-slate-900">{count}</span>{' '}
                  {EDUCATION_LEVEL_LABELS[level as EducationLevel] ?? level}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Bölüme Göre Ara</h2>
        <p className="mt-1 text-sm text-slate-500">
          Bir bölüm seçin, o bölümün hangi nitelik kodlarıyla eşleştiğini görün.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            className={selectClass}
            value={departmentLevel}
            onChange={(e) => setDepartmentLevel(e.target.value as EducationLevel | '')}
          >
            <option value="">Öğrenim seviyesi seçin</option>
            {Object.entries(EDUCATION_LEVEL_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={selectedDepartmentId}
            disabled={!departmentLevel}
            onChange={(e) => {
              setSelectedDepartmentId(e.target.value);
              fetchDepartmentCodes(e.target.value);
            }}
          >
            <option value="">Bölüm seçin</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        {isLoadingDepartmentCodes ? (
          <div className="mt-4 flex justify-center py-6">
            <Loader2 className="animate-spin text-brand-600" size={20} />
          </div>
        ) : departmentCodes ? (
          departmentCodes.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Bu bölüm için eşleşen nitelik kodu bulunamadı.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {departmentCodes.map((qc) => (
                <span
                  key={qc.code}
                  title={qc.description}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                >
                  {qc.code}
                </span>
              ))}
            </div>
          )
        ) : null}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Kod / Açıklama Ara</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchCodes(1);
            }}
            placeholder="Örn. 4531 veya Bilgisayar Mühendisliği"
            className={`${selectClass} w-full max-w-sm`}
          />
          <select
            className={selectClass}
            value={searchLevel}
            onChange={(e) => setSearchLevel(e.target.value as EducationLevel | '')}
          >
            <option value="">Tüm seviyeler</option>
            {Object.entries(EDUCATION_LEVEL_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <Button variant="outline" className="gap-1.5" onClick={() => fetchCodes(1)}>
            <Search size={14} />
            Ara
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
          {isLoadingSearch ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-brand-600" size={20} />
            </div>
          ) : codes.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sonuç bulunamadı.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kod</th>
                  <th className="px-4 py-3">Seviye</th>
                  <th className="px-4 py-3">Açıklama</th>
                  <th className="px-4 py-3">Bölüm Sayısı</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((qc) => (
                  <tr key={qc.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{qc.code}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">
                        {EDUCATION_LEVEL_LABELS[qc.educationLevel] ?? qc.educationLevel}
                      </Badge>
                      {qc.isUniversal && (
                        <Badge variant="info" className="ml-1.5">
                          Genel
                        </Badge>
                      )}
                    </td>
                    <td className="max-w-md px-4 py-3 text-slate-600">{qc.description}</td>
                    <td className="px-4 py-3 text-slate-500">{qc.departmentNames.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Toplam <span className="font-semibold text-slate-900">{totalCount}</span> sonuç
        </p>
        <div className="mt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchCodes(p)} />
        </div>
      </Card>
    </div>
  );
}

export default function AdminQualificationCodesPage() {
  return (
    <AdminShell>
      <AdminQualificationCodesContent />
    </AdminShell>
  );
}
