import { PrismaClient, EducationLevel } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ParsedCode {
  code: string;
  description: string;
  educationLevel: EducationLevel;
  departmentNames: string[];
  isUniversal: boolean;
}

const SUFFIX_RE = /\s+(?:ön)?lisans\s+program\S*(\s+\S+)?\s+mezun\s+olmak\.?\s*$/i;
const SUFFIX_FALLBACK_RE = /\s+program\S*(\s+\S+)?\s+mezun\s+olmak\.?\s*$/i;

function splitDepartmentNames(text: string): string[] {
  return text
    .split(/,\s*| veya /)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseProseFile(filePath: string, educationLevel: EducationLevel): ParsedCode[] {
  const lines = fs
    .readFileSync(filePath, 'utf-8')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  const MANUAL_DEPARTMENT_OVERRIDES: Record<string, string[]> = {
  '3003': ['Adalet'],
};

const results: ParsedCode[] = [];

  for (const line of lines) {
    const [code, text] = line.split('\t');
    if (!code || !text) continue;

    if (MANUAL_DEPARTMENT_OVERRIDES[code]) {
      results.push({
        code,
        description: text.trim(),
        educationLevel,
        departmentNames: MANUAL_DEPARTMENT_OVERRIDES[code],
        isUniversal: false,
      });
      continue;
    }

    const isUniversal = /herhangi bir/i.test(text);
    if (isUniversal) {
      results.push({ code, description: text.trim(), educationLevel, departmentNames: [], isUniversal: true });
      continue;
    }

    const match = SUFFIX_RE.exec(text) ?? SUFFIX_FALLBACK_RE.exec(text);
    if (!match) {
      console.warn(`[UYARI] Suffix eşleşmedi, kod ${code}: "${text}"`);
      results.push({ code, description: text.trim(), educationLevel, departmentNames: [], isUniversal: false });
      continue;
    }

    const deptText = text.slice(0, match.index).trim();
    const departmentNames = splitDepartmentNames(deptText);
    results.push({ code, description: text.trim(), educationLevel, departmentNames, isUniversal: false });
  }

  return results;
}

function parseLiseFile(filePath: string): ParsedCode[] {
  const lines = fs
    .readFileSync(filePath, 'utf-8')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  const byCode = new Map<string, string[]>();
  const universalCodes = new Set<string>();

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length === 2) {
      universalCodes.add(parts[0]);
      continue;
    }
    if (parts.length === 3) {
      const [code, deptName] = parts;
      const arr = byCode.get(code) ?? [];
      arr.push(deptName.trim());
      byCode.set(code, arr);
    }
  }

  const results: ParsedCode[] = [];
  for (const code of universalCodes) {
    results.push({
      code,
      description: 'Ortaöğretim Kurumlarının herhangi bir alanından mezun olmak.',
      educationLevel: EducationLevel.LISE,
      departmentNames: [],
      isUniversal: true,
    });
  }
  for (const [code, deptNames] of byCode.entries()) {
    const unique = Array.from(new Set(deptNames));
    results.push({
      code,
      description: `Ortaöğretim Kurumlarının ${unique.join(' veya ')} mezun olmak.`,
      educationLevel: EducationLevel.LISE,
      departmentNames: unique,
      isUniversal: false,
    });
  }
  return results;
}

async function main(): Promise<void> {
  const scratchDir = process.argv[2];
  if (!scratchDir) {
    throw new Error('Kullanım: ts-node seed-qualification-codes.ts <raw-dosyalarin-bulundugu-klasor>');
  }

  const lise = parseLiseFile(path.join(scratchDir, 'lise-raw.txt'));
  const onlisans = parseProseFile(path.join(scratchDir, 'onlisans-raw.txt'), EducationLevel.ON_LISANS);
  const lisans = parseProseFile(path.join(scratchDir, 'lisans-raw.txt'), EducationLevel.LISANS);

  const all = [...lise, ...onlisans, ...lisans];
  console.log(`Toplam ${all.length} nitelik kodu satırı parse edildi.`);

  const departmentKeySet = new Map<string, { name: string; educationLevel: EducationLevel }>();
  for (const entry of all) {
    for (const name of entry.departmentNames) {
      const key = `${entry.educationLevel}::${name}`;
      if (!departmentKeySet.has(key)) {
        departmentKeySet.set(key, { name, educationLevel: entry.educationLevel });
      }
    }
  }

  console.log(`Toplam ${departmentKeySet.size} benzersiz (bölüm, öğrenim seviyesi) çifti bulundu.`);

  for (const dept of departmentKeySet.values()) {
    await prisma.graduationDepartment.upsert({
      where: { name_educationLevel: { name: dept.name, educationLevel: dept.educationLevel } },
      update: {},
      create: dept,
    });
  }
  console.log('GraduationDepartment tablosu dolduruldu.');

  for (const entry of all) {
    await prisma.qualificationCode.upsert({
      where: { code: entry.code },
      update: {
        description: entry.description,
        educationLevel: entry.educationLevel,
        departmentNames: entry.departmentNames,
        isUniversal: entry.isUniversal,
      },
      create: {
        code: entry.code,
        description: entry.description,
        educationLevel: entry.educationLevel,
        departmentNames: entry.departmentNames,
        isUniversal: entry.isUniversal,
      },
    });
  }
  console.log('QualificationCode tablosu dolduruldu.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
