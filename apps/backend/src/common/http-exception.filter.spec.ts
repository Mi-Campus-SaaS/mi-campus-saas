import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { buildStandardError } from './http-exception.filter';

describe('HttpExceptionFilter buildStandardError', () => {
  it('maps BadRequestException with array messages to validation_error', () => {
    const ex = new BadRequestException({ message: ['a', 'b'] });
    const { status, body } = buildStandardError(ex);
    expect(status).toBe(400);
    expect(body.code).toBe('validation_error');
    expect(body.message).toBe('a, b');
    expect(body.details).toEqual(['a', 'b']);
  });

  it('maps UnauthorizedException', () => {
    const ex = new UnauthorizedException('Nope');
    const { status, body } = buildStandardError(ex);
    expect(status).toBe(401);
    expect(body.code).toBe('unauthorized');
    expect(body.message).toBe('Nope');
  });

  it('maps ForbiddenException', () => {
    const ex = new ForbiddenException('Stop');
    const { status, body } = buildStandardError(ex);
    expect(status).toBe(403);
    expect(body.code).toBe('forbidden');
    expect(body.message).toBe('Stop');
  });

  it('maps ConflictException', () => {
    const ex = new ConflictException('Conflict');
    const { status, body } = buildStandardError(ex);
    expect(status).toBe(409);
    expect(body.code).toBe('conflict');
    expect(body.message).toBe('Conflict');
  });

  it('maps generic HttpException', () => {
    const ex = new HttpException('Gone', 410);
    const { status, body } = buildStandardError(ex);
    expect(status).toBe(410);
    expect(body.code).toBe('internal_error'); // unknown status code maps to internal_error in codeFromStatus default
    expect(body.message).toBe('Gone');
  });

  it('maps unknown error', () => {
    const ex = new Error('Oops');
    const { status, body } = buildStandardError(ex);
    expect(status).toBe(500);
    expect(body.code).toBe('internal_error');
    expect(body.message).toBe('Oops');
  });
});
