import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const OUTPUT_DIR = resolve('output');
const AUDIO_DIR = resolve('audio');
const TIMESTAMPS_FILE = join(OUTPUT_DIR, 'timestamps.txt');
const OUTPUT_FILE = join(OUTPUT_DIR, 'demo.mp4');

// ── Helpers ──

function ffprobe(filePath, entry = 'format') {
  const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
  const raw = execSync(cmd, { encoding: 'utf-8' });
  const info = JSON.parse(raw);
  return parseFloat(info[entry]?.duration ?? info.format?.duration ?? '0');
}

function getDuration(filePath) {
  return ffprobe(filePath);
}

// ── 1. Find most recent .webm ──

const webmFiles = readdirSync(OUTPUT_DIR)
  .filter(f => f.endsWith('.webm'))
  .map(f => ({ name: f, path: join(OUTPUT_DIR, f), mtime: statSync(join(OUTPUT_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

if (webmFiles.length === 0) {
  console.error('ERROR: No .webm files found in output/');
  process.exit(1);
}

const videoFile = webmFiles[0].path;
console.log(`Video: ${webmFiles[0].name}`);

// ── 2. Parse timestamps.txt ──

if (!existsSync(TIMESTAMPS_FILE)) {
  console.error('ERROR: timestamps.txt not found');
  process.exit(1);
}

const sections = readFileSync(TIMESTAMPS_FILE, 'utf-8')
  .trim()
  .split('\n')
  .map(line => {
    const [name, ts] = line.trim().split(/\s+/);
    return { name, timestamp: parseFloat(ts) };
  });

console.log(`Sections: ${sections.length}`);

// ── 3. Read audio durations ──

for (const s of sections) {
  s.audioFile = join(AUDIO_DIR, `${s.name}.mp3`);
  if (!existsSync(s.audioFile)) {
    console.error(`ERROR: Missing audio file ${s.audioFile}`);
    process.exit(1);
  }
  s.audioDuration = getDuration(s.audioFile);
}

// ── 4. Verify no overlaps ──

console.log('\n── Overlap Check ──');
for (let i = 0; i < sections.length; i++) {
  const s = sections[i];
  const end = s.timestamp + s.audioDuration;
  const nextStart = i < sections.length - 1 ? sections[i + 1].timestamp : Infinity;
  const gap = nextStart - end;
  s.fits = gap >= 0;

  if (!s.fits) {
    console.log(`WARNING: ${s.name} ends at ${end.toFixed(2)}s but next section starts at ${nextStart.toFixed(2)}s (overlap ${(-gap).toFixed(2)}s)`);
  }
}

// ── 5. Get total video duration ──

const videoDuration = getDuration(videoFile);
console.log(`\nVideo duration: ${videoDuration.toFixed(2)}s`);

// ── 6. Build ffmpeg command ──

const inputArgs = ['-i', videoFile];
for (const s of sections) {
  inputArgs.push('-i', s.audioFile);
}

// Build filter_complex
const filterParts = [];
for (let i = 0; i < sections.length; i++) {
  const s = sections[i];
  const delayMs = Math.round(s.timestamp * 1000);
  filterParts.push(`[${i + 1}:a]adelay=${delayMs}|${delayMs},apad=whole_dur=${videoDuration}[a${i}]`);
}

const mixInputs = sections.map((_, i) => `[a${i}]`).join('');
filterParts.push(`${mixInputs}amix=inputs=${sections.length}:dropout_transition=0:normalize=0[audio]`);

const filterComplex = filterParts.join(';');

const ffmpegArgs = [
  ...inputArgs,
  '-filter_complex', filterComplex,
  '-map', '0:v',
  '-map', '[audio]',
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '23',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-y',
  OUTPUT_FILE,
];

// ── 7. Execute ffmpeg ──

console.log('\n── Running ffmpeg ──\n');

const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

ffmpeg.stdout.on('data', (d) => process.stdout.write(d));
ffmpeg.stderr.on('data', (d) => process.stderr.write(d));

ffmpeg.on('close', (code) => {
  if (code !== 0) {
    console.error(`\nERROR: ffmpeg exited with code ${code}`);
    process.exit(code);
  }

  // ── 8. Verify result ──

  if (!existsSync(OUTPUT_FILE)) {
    console.error('\nERROR: output/demo.mp4 was not created');
    process.exit(1);
  }

  const outputDuration = getDuration(OUTPUT_FILE);
  const outputSize = (statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);

  // ── 9. Summary ──

  console.log('\n\n── Summary ──\n');
  console.log(`Output: demo.mp4 (${outputSize} MB, ${outputDuration.toFixed(2)}s)\n`);

  const header = 'Section'.padEnd(20) + 'Start'.padStart(8) + 'Duration'.padStart(10) + 'End'.padStart(8) + 'Gap'.padStart(8) + '  Status';
  console.log(header);
  console.log('─'.repeat(header.length));

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const end = s.timestamp + s.audioDuration;
    const nextStart = i < sections.length - 1 ? sections[i + 1].timestamp : videoDuration;
    const gap = nextStart - end;
    const status = gap >= 0 ? 'OK' : `OVERLAP ${(-gap).toFixed(2)}s`;

    console.log(
      s.name.padEnd(20) +
      s.timestamp.toFixed(2).padStart(8) +
      s.audioDuration.toFixed(2).padStart(10) +
      end.toFixed(2).padStart(8) +
      gap.toFixed(2).padStart(8) +
      '  ' + status
    );
  }

  console.log('\nDone.');
});
