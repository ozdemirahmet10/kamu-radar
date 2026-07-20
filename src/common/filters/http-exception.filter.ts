import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '@app/shared-kernel';

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, title, detail, code } = this.resolveException(exception);

    const problem: ProblemDetails = {
      type: `https://kpss-kariyer.com/errors/${code.toLowerCase()}`,
      title,
      status,
      detail,
      instance: request.url,
      code,
    };

    response.status(status).contentType('application/problem+json').send(problem);
  }

  private resolveException(exception: unknown): {
    status: number;
    title: string;
    detail: string;
    code: string;
  } {
    if (exception instanceof DomainException) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        title: exception.name,
        detail: exception.message,
        code: exception.code,
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const detail =
        typeof response === 'string'
          ? response
          : (((response as Record<string, unknown>).message as string | string[])?.toString() ??
            exception.message);

      return {
        status: exception.getStatus(),
        title: exception.name,
        detail,
        code: HttpStatus[exception.getStatus()] ?? 'HTTP_ERROR',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      title: 'Internal Server Error',
      detail: 'Beklenmeyen bir hata oluştu.',
      code: 'INTERNAL_SERVER_ERROR',
    };
  }
}
