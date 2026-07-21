import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const videoRoot = resolve(scriptDir, '..');
const input = resolve(process.argv[2] || join(videoRoot, 'work', 'guided-demo-capture.webm'));
const output = resolve(process.argv[3] || join(videoRoot, 'work', 'guided-demo-conformed.mp4'));
const cutStart = Number(process.argv[4] || 25);
const cutEnd = Number(process.argv[5] || 58);
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

const inputDuration = duration(input);
if (!(cutStart >= 0 && cutEnd > cutStart && cutEnd < inputDuration)) {
  throw new Error(`Invalid conform cut ${cutStart}-${cutEnd} for ${inputDuration.toFixed(2)}s capture.`);
}

await mkdir(dirname(output), { recursive: true });
run(ffmpeg, [
  '-y',
  '-i', input,
  '-filter_complex',
  `[0:v]split=2[before][after];[before]trim=start=0:end=${cutStart},setpts=PTS-STARTPTS[a];[after]trim=start=${cutEnd},setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,fps=30,format=yuv420p[v]`,
  '-map', '[v]',
  '-an',
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '16',
  '-profile:v', 'high',
  '-pix_fmt', 'yuv420p',
  output,
]);

console.log(`Conformed capture: ${output}`);
console.log(`Duration: ${inputDuration.toFixed(2)}s -> ${duration(output).toFixed(2)}s`);
console.log(`Removed redundant hold: ${cutStart.toFixed(2)}s-${cutEnd.toFixed(2)}s`);
