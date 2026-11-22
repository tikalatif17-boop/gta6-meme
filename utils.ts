import { existsSync, mkdirSync, statSync } from 'node:fs';

export const X_STATUS_PATTERN =
  /^https:\/\/(?:x|twitter)\.com\/([a-zA-Z0-9_]{1,15})\/status\/(\d+)(?:\?.*)?$/;

export interface ValidatedMemeSubmission {
  url: string;
}

/**
 * Memverifikasi batas ukuran file dalam satuan bytes
 */
export function verifyFileSize(filePath: string, maxBytes: number): void {
  const stats = statSync(filePath);
  if (stats.size > maxBytes) {
    throw new Error(`Ukuran file ${filePath} (${stats.size} bytes) melebihi batas maksimum ${maxBytes} bytes`);
  }
}

/**
 * Memastikan direktori tujuan tersedia
 */
export function ensureOutputDirectory(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Normalisasi dan validasi URL postingan X (Twitter)
 */
export function normalizeXUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('URL postingan tidak valid atau kosong');
  }

  const clean = rawUrl.trim();
  const match = clean.match(X_STATUS_PATTERN);

  if (!match) {
    throw new Error(`URL postingan X tidak memenuhi format https://x.com/<handle>/status/<id>: "${clean}"`);
  }

  const [, handle, statusId] = match;
  return `https://x.com/${handle}/status/${statusId}`;
}

/**
 * Parsing payload JSON submission dan memvalidasi keberadaan properti "url"
 */
export function parseSubmissionJson(rawJson: string): ValidatedMemeSubmission {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error(`Gagal mem-parsing payload JSON: ${(err as Error).message}`);
  }

  if (typeof parsed !== 'object' || parsed === null || !('url' in parsed)) {
    throw new Error('Payload JSON harus berupa objek yang memuat field "url"');
  }

  const candidateUrl = (parsed as Record<string, unknown>).url;
  if (typeof candidateUrl !== 'string') {
    throw new Error('Field "url" dalam POST.json harus bernilai string');
  }

  const validatedUrl = normalizeXUrl(candidateUrl);
  return { url: validatedUrl };
}
