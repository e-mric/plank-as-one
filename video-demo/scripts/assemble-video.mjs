import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const videoRoot = resolve(scriptDir, '..');
const videoInput = resolve(process.argv[2] || join(videoRoot, 'work', 'guided-demo-capture.webm'));
const audioInput = resolve(process.argv[3] || join(videoRoot, 'input', 'narration-ready.wav'));
const output = resolve(process.argv[4] || join(videoRoot, 'dist', 'plank-as-one-build-week-demo.mp4'));
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: options.capture ? 'pipe' : 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}\n${result.stderr || ''}`);
  return result.stdout;
}

function duration(path) {
  return Number(run(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path], { capture: true }).trim());
}

const audioDuration = duration(audioInput);
const videoDuration = duration(videoInput);
const finalDuration = Math.min(179, audioDuration + 0.8);
if (!Number.isFinite(audioDuration) || !Number.isFinite(videoDuration)) throw new Error('Unable to read source durations.');
if (videoDuration < finalDuration) throw new Error(`Capture is ${videoDuration.toFixed(2)}s but narration needs ${finalDuration.toFixed(2)}s.`);

await mkdir(dirname(output), { recursive: true });
run(ffmpeg, [
  '-y',
  '-i', videoInput,
  '-i', audioInput,
  '-filter_complex',
  '[0:v]fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#fff4ea,format=yuv420p[v];[1:a]aresample=48000,highpass=f=70,lowpass=f=16000,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.95,apad=pad_dur=1[a]',
  '-map', '[v]',
  '-map', '[a]',
  '-t', finalDuration.toFixed(3),
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '18',
  '-profile:v', 'high',
  '-level:v', '4.1',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-ar', '48000',
  '-ac', '2',
  output,
]);

console.log(`Canonical MP4: ${output}`);
console.log(`Duration: ${finalDuration.toFixed(2)}s`);
