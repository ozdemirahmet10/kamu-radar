import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';

export interface QualificationCodeMatch {
  code: string;
  description: string;
}

interface QualificationCodeRow {
  code: string;
  description: string;
}

@Injectable()
export class QualificationCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async getCodesForDepartment(graduationDepartmentId: string | null): Promise<QualificationCodeMatch[]> {
    if (!graduationDepartmentId) {
      return [];
    }

    const department = await this.prisma.graduationDepartment.findUnique({
      where: { id: graduationDepartmentId },
    });
    if (!department) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<QualificationCodeRow[]>`
      SELECT code, description FROM qualification_codes
      WHERE education_level = ${department.educationLevel}::"EducationLevel"
        AND (is_universal = true OR department_names ? ${department.name})
      ORDER BY code ASC
    `;

    return rows;
  }

  /**
   * Verilen kodlardan hangilerinin gerçek bir ÖSYM nitelik kodu (referans tabloda
   * kayıtlı) olduğunu döner. İlanlardan LLM ile çıkarılan "nitelik kodu" alanı bazen
   * KPSS puan türü gibi nitelik kodu olmayan değerler içerebiliyor — bunları eşleştirme
   * kontrolüne dahil etmemek için kullanılır.
   */
  async filterKnownCodes(codes: string[]): Promise<Set<string>> {
    if (codes.length === 0) {
      return new Set();
    }
    const rows = await this.prisma.qualificationCode.findMany({
      where: { code: { in: codes } },
      select: { code: true },
    });
    return new Set(rows.map((r) => r.code));
  }
}
