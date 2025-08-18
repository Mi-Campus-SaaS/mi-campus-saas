import {
  getExtension,
  hasDangerousDoubleExtension,
  isAllowedExtension,
  sniffMimeFromBuffer,
  extensionToMime,
} from '../src/common/upload.util';

describe('upload.util', () => {
  it('extracts extension', () => {
    expect(getExtension('file.pdf')).toBe('pdf');
    expect(getExtension('archive.tar.gz')).toBe('gz');
    expect(getExtension('noext')).toBe('');
  });

  it('detects dangerous double extensions', () => {
    expect(hasDangerousDoubleExtension('report.pdf')).toBe(false);
    expect(hasDangerousDoubleExtension('image.png')).toBe(false);
    expect(hasDangerousDoubleExtension('report.pdf.exe')).toBe(true);
    expect(hasDangerousDoubleExtension('safe.tar.gz')).toBe(false);
    expect(hasDangerousDoubleExtension('weird.js.zip')).toBe(true);
  });

  it('validates allowed extensions list', () => {
    process.env.ALLOWED_MATERIAL_EXT = 'pdf,png,jpg,zip';
    expect(isAllowedExtension('report.pdf')).toBe(true);
    expect(isAllowedExtension('image.JPG')).toBe(true);
    expect(isAllowedExtension('script.js')).toBe(false);
  });

  it('maps extension to mime', () => {
    expect(extensionToMime('pdf')).toBe('application/pdf');
    expect(extensionToMime('png')).toBe('image/png');
    expect(extensionToMime('jpg')).toBe('image/jpeg');
    expect(extensionToMime('zip')).toBe('application/zip');
  });

  it('sniffs PDF/PNG/JPEG/ZIP', () => {
    const pdf = Buffer.from('%PDF-1.7');
    expect(sniffMimeFromBuffer(pdf)).toBe('application/pdf');
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(sniffMimeFromBuffer(png)).toBe('image/png');
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(sniffMimeFromBuffer(jpeg)).toBe('image/jpeg');
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    expect(sniffMimeFromBuffer(zip)).toBe('application/zip');
    const unknown = Buffer.from([0x00, 0x11, 0x22, 0x33]);
    expect(sniffMimeFromBuffer(unknown)).toBe('unknown');
  });
});
