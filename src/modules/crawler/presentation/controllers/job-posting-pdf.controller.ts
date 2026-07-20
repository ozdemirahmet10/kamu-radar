import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { GetJobPostingPdfUseCase } from '../../application/use-cases/get-job-posting-pdf.use-case';

/**
 * İlan PDF'i ikili (binary) içerik olduğu için global ResponseEnvelopeInterceptor'ın
 * {data, meta} sarmalamasından kaçınmak amacıyla @Res() ile doğrudan Express
 * response'una yazılır (Nest'in kendi response gönderim akışı devre dışı kalır).
 */
@ApiTags('job-postings')
@Controller('job-postings')
export class JobPostingPdfController {
  constructor(private readonly getJobPostingPdfUseCase: GetJobPostingPdfUseCase) {}

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { buffer, fileName } = await this.getJobPostingPdfUseCase.execute(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
