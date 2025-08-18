import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  PayloadTooLargeException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

export type StandardErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

function codeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'bad_request';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 413:
      return 'payload_too_large';
    case 415:
      return 'unsupported_media_type';
    case 422:
      return 'unprocessable_entity';
    case 429:
      return 'too_many_requests';
    default:
      return 'internal_error';
  }
}

function parseResponseMessage(response: unknown, fallback: string): { message: string; details?: unknown } {
  if (typeof response === 'string') return { message: response };
  if (response && typeof response === 'object') {
    const raw = (response as { message?: unknown }).message;
    if (Array.isArray(raw))
      return { message: raw.filter((v) => typeof v === 'string').join(', ') || fallback, details: raw };
    if (typeof raw === 'string') return { message: raw };
  }
  return { message: fallback };
}

function fromHttpException(
  ex: HttpException,
  code: string,
  fallback: string,
): { status: number; body: StandardErrorBody } {
  const status = ex.getStatus();
  const { message } = parseResponseMessage(ex.getResponse() as unknown, fallback);
  return { status, body: { code, message } };
}

function fromGenericHttp(ex: HttpException): { status: number; body: StandardErrorBody } {
  const status = ex.getStatus();
  const { message } = parseResponseMessage(ex.getResponse() as unknown, ex.message || 'Error');
  return { status, body: { code: codeFromStatus(status), message } };
}

function fromDbError(ex: unknown): { status: number; body: StandardErrorBody } {
  return {
    status: 400,
    body: {
      code: 'database_error',
      message: 'Database error',
      details: { code: (ex as { code?: string }).code },
    },
  };
}

export function buildStandardError(exception: unknown): { status: number; body: StandardErrorBody } {
  if (exception instanceof BadRequestException) {
    const status = exception.getStatus();
    const { message, details } = parseResponseMessage(exception.getResponse() as unknown, 'Bad request');
    return { status, body: { code: 'validation_error', message, details } };
  }
  if (exception instanceof UnauthorizedException) return fromHttpException(exception, 'unauthorized', 'Unauthorized');
  if (exception instanceof ForbiddenException) return fromHttpException(exception, 'forbidden', 'Forbidden');
  if (exception instanceof ConflictException) return fromHttpException(exception, 'conflict', 'Conflict');
  if (exception instanceof PayloadTooLargeException)
    return fromHttpException(exception, 'payload_too_large', 'Payload too large');
  if (exception instanceof UnprocessableEntityException)
    return fromHttpException(exception, 'unprocessable_entity', 'Unprocessable entity');
  if (exception instanceof HttpException) return fromGenericHttp(exception);
  if (exception instanceof QueryFailedError) return fromDbError(exception as unknown);
  const message = exception instanceof Error ? exception.message : 'Internal server error';
  return { status: 500, body: { code: 'internal_error', message } };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = buildStandardError(exception);
    if (response.headersSent || (response as unknown as { writableEnded?: boolean }).writableEnded) {
      return;
    }
    response.status(status).json({ code: body.code, message: body.message, details: body.details ?? null });
  }
}
