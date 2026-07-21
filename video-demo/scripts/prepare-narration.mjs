import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const videoRoot = resolve(scriptDir, '..');
const input = resolve(process.argv[2] || join(videoRoot, 'input', 'narration.mp3'));
const output = resolve(process.argv[3] || join(videoRoot, 'input', 'narration-ready.wav'));
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';

function run(command, args, capture = false) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}\n${result.stderr || ''}`);
  return result.stdout;
}

function duration(path) {
  return Number(run(ffprobe, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    path,
  ], true).trim());
}

await mkdir(dirname(output), { recursive: true });
run(ffmpeg, [
  '-y',
  '-i', input,
  '-af',
  'silenceremove=start_periods=1:start_duration=0.05:start_threshold=-42dB:start_silence=0.12:stop_periods=-1:stop_duration=0.35:stop_threshold=-42dB:stop_silence=0.30,atempo=1.085',
  '-ar', '48000',
  '-ac', '1',
  '-codec:a', 'pcm_s24le',
  output,
]);

const sourceDuration = duration(input);
const outputDuration = duration(output);
if (outputDuration >= 179) throw new Error(`Prepared narration is still too long: ${outputDuration.toFixed(2)}s.`);

console.log(`Prepared narration: ${output}`);
console.log(`Duration: ${sourceDuration.toFixed(2)}s -> ${outputDuration.toFixed(2)}s`);
