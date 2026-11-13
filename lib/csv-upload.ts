import 'server-only';
import { csvMaxBytes } from './csv-import-format';

export async function readUpload(request: Request) {
  if (Number(request.headers.get('content-length')) > csvMaxBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > csvMaxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks, size);
  } finally {
    reader.releaseLock();
  }
}

