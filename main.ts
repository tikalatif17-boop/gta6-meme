import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  parseSubmissionJson,
  ensureOutputDirectory,
  verifyFileSize
} from './utils.ts';

const MAX_JSON_BYTES = 8192;

export interface RunnerConfig {
  botDir: string;
  outputDir: string;
}

/**
 * Resolusi path direktori bot dan output
 */
export function getRunnerConfig(): RunnerConfig {
  const botDir = process.env.MAKEFUN_BOT_DIR || '.';
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || 'out';
  return { botDir, outputDir };
}

/**
 * Eksekusi utama runner entrypoint
 */
export function main(): void {
  const config = getRunnerConfig();
  const sourcePath = resolve(config.botDir, 'POST.json');
  const targetDir = resolve(config.outputDir);
  const targetPath = join(targetDir, 'POST.json');

  if (!existsSync(sourcePath)) {
    console.error(`[Error] File sumber POST.json tidak ditemukan pada path: ${sourcePath}`);
    process.exit(1);
  }

  try {
    verifyFileSize(sourcePath, MAX_JSON_BYTES);
  } catch (sizeErr) {
    console.error(`[Error] ${(sizeErr as Error).message}`);
    process.exit(1);
  }

  let rawContent: string;
  try {
    rawContent = readFileSync(sourcePath, 'utf8');
  } catch (readErr) {
    console.error(`[Error] Gagal membaca ${sourcePath}: ${(readErr as Error).message}`);
    process.exit(1);
  }

  let submission;
  try {
    submission = parseSubmissionJson(rawContent);
  } catch (parseErr) {
    console.error(`[Error] Validasi gagal: ${(parseErr as Error).message}`);
    process.exit(1);
  }

  ensureOutputDirectory(targetDir);

  const formattedOutput = JSON.stringify(submission, null, 2) + '\n';
  writeFileSync(targetPath, formattedOutput, 'utf8');
}

main();
