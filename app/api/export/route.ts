/**
 * Server-side Sharp recompression is not available on Cloudflare Workers
 * (sharp is a native Node module). Responding 501 makes the editor fall back
 * to the browser's own canvas encoder — see lib/export/sharp-client.ts.
 */
import { apiError, methodNotAllowed } from '@/lib/api/errors';

export async function POST() {
  return apiError(
    501,
    'not_implemented',
    'Server-side image optimization is not available on this deployment',
    'Encode the image in the browser instead; the editor does this automatically.'
  );
}

export async function GET() {
  return methodNotAllowed(['POST']);
}
