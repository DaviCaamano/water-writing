import zlib from 'zlib';
import { promisify } from 'util';

// Turn zlib functions into promises so we don't have to use callbacks.
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export const compressBody = async (text: string): Promise<Buffer> =>
  gzip(Buffer.from(text, 'utf-8'));

export const decompressBody = async (data: Buffer): Promise<string> => {
  const result = await gunzip(data);
  return result.toString('utf-8');
};
