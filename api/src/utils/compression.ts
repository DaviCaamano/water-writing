import zlib from 'zlib';
import { promisify } from 'util';

// Turn zlib functions into promises so we don't have to use callbacks.
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export async function compressBody(text: string): Promise<Buffer> {
  return gzip(Buffer.from(text, 'utf-8'));
}

export async function decompressBody(data: Buffer): Promise<string> {
  const result = await gunzip(data);
  return result.toString('utf-8');
}
