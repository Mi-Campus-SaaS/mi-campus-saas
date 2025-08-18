import { readFileSync } from 'fs';

export function parseCommaList(input: string | undefined, defaultList: readonly string[]): readonly string[] {
  if (!input) return defaultList;
  return input
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx <= 0 || idx === filename.length - 1) return '';
  return filename.slice(idx + 1).toLowerCase();
}

const DEFAULT_ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'zip'] as const;
const DANGEROUS_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'com',
  'scr',
  'ps1',
  'js',
  'vbs',
  'msi',
  'dll',
  'sys',
  'sh',
  'apk',
  'jar',
] as const;

export function getAllowedExtensionsFromEnv(): readonly string[] {
  return parseCommaList(process.env.ALLOWED_MATERIAL_EXT, DEFAULT_ALLOWED_EXTENSIONS);
}

export function isAllowedExtension(filename: string, allowedExtensions?: readonly string[]): boolean {
  const allowed = allowedExtensions ?? getAllowedExtensionsFromEnv();
  const ext = getExtension(filename);
  return ext.length > 0 && allowed.includes(ext);
}

export function hasDangerousDoubleExtension(filename: string): boolean {
  const tokens = filename.toLowerCase().split('.');
  if (tokens.length <= 2) return false;
  const middle = tokens.slice(0, -1);
  const last = tokens[tokens.length - 1];
  const isDangerousLast = DANGEROUS_EXTENSIONS.includes(last as (typeof DANGEROUS_EXTENSIONS)[number]);
  const isDangerousMiddle = middle.some((tok) =>
    DANGEROUS_EXTENSIONS.includes(tok as (typeof DANGEROUS_EXTENSIONS)[number]),
  );
  return isDangerousLast || isDangerousMiddle;
}

export function extensionToMime(ext: string): string | undefined {
  switch (ext.toLowerCase()) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'zip':
      return 'application/zip';
    default:
      return undefined;
  }
}

export function sniffMimeFromFile(filePath: string): string {
  const buffer = readFileSync(filePath);
  return sniffMimeFromBuffer(buffer);
}

export function sniffMimeFromBuffer(buffer: Buffer): string {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  )
    return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
  )
    return 'application/zip';
  return 'unknown';
}
