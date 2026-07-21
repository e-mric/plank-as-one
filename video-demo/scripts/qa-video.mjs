import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const videoRoot = resolve(scriptDir, '..');
const input = resolve(process.argv[2] || join(videoRoot, 'dist', 'plank-as-one-build-week-demo.mp4'));
const qaDir = join(videoRoot, 'qa');
const frameDir = join(qaDir, 'frames');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';

function run(command, args, capture = false) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}\n${result.stderr || ''}`);
  return capture ? `${result.stdout || ''}\n${result.stderr || ''}` : '';
}

await mkdir(frameDir, { recursive: true });
const probe = JSON.parse(run(ffprobe, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', input], true));
const video = probe.streams.find((stream) => stream.codec_type === 'video');
const audio = probe.streams.find((stream) => stream.codec_type === 'audio');
const duration = Number(probe.format.duration);
const technicalChecks = {
  underThreeMinutes: duration > 0 && duration < 180,
  resolution1920x1080: video?.width === 1920 && video?.height === 1080,
  videoCodecH264: video?.codec_name === 'h264',
  audioPresent: Boolean(audio),
  audioCodecAac: audio?.codec_name === 'aac',
  audioSampleRate48k: Number(audio?.sample_rate) === 48000,
  audioStereo: Number(audio?.channels) === 2,
};

const blackLog = run(ffmpeg, ['-hide_banner', '-i', input, '-vf', 'blackdetect=d=0.5:pix_th=0.02', '-an', '-f', 'null', 'NUL'], true);
const silenceLog = run(ffmpeg, ['-hide_banner', '-i', input, '-af', 'silencedetect=noise=-45dB:d=1.5', '-vn', '-f', 'null', 'NUL'], true);
const blackSegments = [...blackLog.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)].map((match) => ({ start: Number(match[1]), end: Number(match[2]), duration: Number(match[3]) }));
const silenceStarts = [...silenceLog.matchAll(/silence_start: ([\d.]+)/g)].map((match) => Number(match[1]));
const silenceEnds = [...silenceLog.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map((match) => ({ end: Number(match[1]), duration: Number(match[2]) }));

run(ffmpeg, ['-y', '-i', input, '-vf', 'fps=1/10,scale=480:-2', '-q:v', '2', join(frameDir, 'sample-%02d.jpg')]);
run(ffmpeg, ['-y', '-i', input, '-vf', 'fps=1/10,scale=480:270,tile=5x4:padding=8:margin=8:color=#fff4ea', '-frames:v', '1', '-update', '1', join(qaDir, 'contact-sheet.jpg')]);

const report = {
  input,
  durationSeconds: duration,
  technicalChecks,
  blackSegments,
  silenceStarts,
  silenceEnds,
  deadAirAcceptable: silenceEnds.every((segment) => segment.duration <= 2 && segment.end >= duration - 2.1),
  manualChecksRequired: [
    'Narration aligns with the shot plan and visible state changes.',
    'Sampled frames are sharp, correctly framed, and free of personal data or browser chrome.',
    'No scene is accidentally repeated or held without narrative purpose.',
    'Every spoken claim is supported by the submitted build, README, tests, or review evidence.',
    'The video contains no third-party music, marks, footage, or unauthorized visual assets.',
  ],
};
await writeFile(join(qaDir, 'ffprobe.json'), `${JSON.stringify(probe, null, 2)}\n`);
await writeFile(join(qaDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);

const failed = Object.entries(technicalChecks).filter(([, passed]) => !passed).map(([name]) => name);
console.log(JSON.stringify(report, null, 2));
if (failed.length) throw new Error(`QA failed: ${failed.join(', ')}`);
if (blackSegments.some((segment) => segment.duration > 1)) throw new Error('QA failed: black frame segment longer than one second.');
if (!report.deadAirAcceptable) throw new Error('QA failed: silence longer than 1.5 seconds occurs outside the final two-second tail.');
