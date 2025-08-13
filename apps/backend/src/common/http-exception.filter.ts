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

export function buildStandardError(exception: unknown): { status: number; body: StandardErrorBody } {
  // Validation / bad request with array messages
  if (exception instanceof BadRequestException) {
    const status = exception.getStatus();
    const response = exception.getResponse() as unknown;
    let message = 'Bad request';
    let details: unknown;
    if (typeof response === 'string') {
      message = response;
    } else if (response && typeof response === 'object') {
      const msg = (response as { message?: unknown }).message;
      if (Array.isArray(msg)) {
        details = msg;
        message = msg.filter((v) => typeof v === 'string').join(', ') || 'Bad request';
      } else if (typeof msg === 'string') {
        message = msg;
      }
    }
    return { status, body: { code: 'validation_error', message, details } };
  }

  // Authentication / authorization
  if (exception instanceof UnauthorizedException) {
    const status = exception.getStatus();
    const response = exception.getResponse() as unknown;
    const message =
      typeof response === 'string' ? response : (response as { message?: string }).message || 'Unauthorized';
    return { status, body: { code: 'unauthorized', message } };
  }
  if (exception instanceof ForbiddenException) {
    const status = exception.getStatus();
    const response = exception.getResponse() as unknown;
    const message = typeof response === 'string' ? response : (response as { message?: string }).message || 'Forbidden';
    return { status, body: { code: 'forbidden', message } };
  }

  // Conflict / payload / unprocessable
  if (exception instanceof ConflictException) {
    const status = exception.getStatus();
    const response = exception.getResponse() as unknown;
    const message = typeof response === 'string' ? response : (response as { message?: string }).message || 'Conflict';
    return { status, body: { code: 'conflict', message } };
  }
  if (exception instanceof PayloadTooLargeException) {
    const status = exception.getStatus();
    const response = exception.getResponse() as unknown;
    const message =
      typeof response === 'string' ? response : (response as { message?: string }).message || 'Payload too large';
    return { status, body: { code: 'payload_too_large', message } };
  }
  if (exception instanceof UnprocessableEntityException) {
    const status = exception.getStatus();
    const response = exception.getResponse() as unknown;
    const message =
      typeof response === 'string' ? response : (response as { message?: string }).message || 'Unprocessable entity';
    return { status, body: { code: 'unprocessable_entity', message } };
  }

  // Generic HTTP exception
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const resp = exception.getResponse() as unknown;
    let message = exception.message || 'Error';
    if (typeof resp === 'string') message = resp;
    else if (resp && typeof resp === 'object') {
      const maybeMsg = (resp as { message?: unknown }).message;
      if (typeof maybeMsg === 'string') message = maybeMsg;
      else if (Array.isArray(maybeMsg)) message = maybeMsg.join(', ');
    }
    return { status, body: { code: codeFromStatus(status), message } };
  }

  // Database failures
  if (exception instanceof QueryFailedError) {
    return {
      status: 400,
      body: {
        code: 'database_error',
        message: 'Database error',
        details: { code: (exception as unknown as { code?: string }).code },
      },
    };
  }

  // Unknown error
  const message = exception instanceof Error ? exception.message : 'Internal server error';
  return { status: 500, body: { code: 'internal_error', message } };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = buildStandardError(exception);
    response.status(status).json({ code: body.code, message: body.message, details: body.details ?? null });
  }
}
