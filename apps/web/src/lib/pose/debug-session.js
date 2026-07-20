import { canvasToPngBlob, drawPoseDebugOverlay, getPoseDiagnosticLabel } from './debug-overlay.js';

function fileSafeTimestamp(date = new Date()) {
  return date.toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getPoseCaptureDecision({ lastSignature = '', lastCaptureAt = -Infinity, stage, result, frameTimeMs, minIntervalMs = 2500 }) {
  const diagnostic = getPoseDiagnosticLabel(result, stage);
  const signature = `${stage}:${diagnostic}`;
  const stateChanged = signature !== lastSignature;
  const periodic = frameTimeMs - lastCaptureAt >= minIntervalMs;
  return {
    capture: stateChanged || periodic,
    reason: stateChanged ? 'state-change' : periodic ? 'periodic' : null,
    signature,
  };
}

export function createPoseDebugSession({ minIntervalMs = 2500, maxCaptures = 90, onUpdate = () => {} } = {}) {
  let active = false;
  let directoryHandle = null;
  let sessionDirectory = null;
  let sessionId = '';
  let outputMode = 'downloads';
  let captureCount = 0;
  let lastCaptureAt = -Infinity;
  let lastSignature = '';
  let lastFrame = null;
  let pendingWrites = Promise.resolve();
  let captureSettled = Promise.resolve();
  let captureInFlight = false;
  let manifest = [];
  let lastError = '';

  function snapshot(extra = {}) {
    return {
      active,
      sessionId,
      outputMode,
      captureCount,
      lastDiagnostic: lastFrame?.result ? getPoseDiagnosticLabel(lastFrame.result, lastFrame.stage) : '',
      lastFile: manifest.at(-1)?.image || '',
      error: lastError,
      ...extra,
    };
  }

  function notify(extra) {
    onUpdate(snapshot(extra));
  }

  async function start() {
    if (active) return snapshot();
    lastError = '';
    directoryHandle = null;
    sessionDirectory = null;
    outputMode = 'downloads';
    if (typeof window.showDirectoryPicker === 'function') {
      try {
        directoryHandle = await window.showDirectoryPicker({ id: 'plank-pose-debug', mode: 'readwrite' });
        outputMode = 'directory';
      } catch (error) {
        if (error?.name === 'AbortError') {
          notify({ cancelled: true });
          return { ...snapshot(), started: false, cancelled: true };
        }
        lastError = error?.message || 'Directory access failed';
      }
    }
    sessionId = `pose-debug-${fileSafeTimestamp()}`;
    if (directoryHandle) sessionDirectory = await directoryHandle.getDirectoryHandle(sessionId, { create: true });
    active = true;
    captureCount = 0;
    lastCaptureAt = -Infinity;
    lastSignature = '';
    manifest = [];
    pendingWrites = Promise.resolve();
    captureSettled = Promise.resolve();
    captureInFlight = false;
    notify({ started: true });
    return { ...snapshot(), started: true };
  }

  async function writeFile(filename, content) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: 'application/json' });
    if (sessionDirectory) {
      const fileHandle = await sessionDirectory.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }
    downloadBlob(blob, `${sessionId}-${filename}`);
  }

  async function capture(frame, reason = 'automatic') {
    if (!active || captureInFlight || !frame?.video || frame.video.readyState < 2 || captureCount >= maxCaptures) return false;
    captureInFlight = true;
    captureSettled = (async () => {
      try {
        const capturedAt = new Date();
        const canvas = document.createElement('canvas');
        const record = drawPoseDebugOverlay({ ...frame, canvas, capturedAt, reason });
        const imageBlob = await canvasToPngBlob(canvas);
        const index = String(captureCount + 1).padStart(3, '0');
        const label = record.diagnostic.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, '') || 'frame';
        const baseName = `${index}-${fileSafeTimestamp(capturedAt)}-${record.phase}-${label}`;
        const imageName = `${baseName}.png`;
        const dataName = `${baseName}.json`;
        const manifestEntry = { image: imageName, data: dataName, ...record };
        captureCount += 1;
        lastCaptureAt = frame.frameTimeMs ?? performance.now();
        lastSignature = `${frame.stage}:${record.diagnostic}`;
        manifest.push(manifestEntry);
        pendingWrites = pendingWrites.then(async () => {
          await writeFile(imageName, imageBlob);
          await writeFile(dataName, JSON.stringify(record, null, 2));
        }).catch((error) => {
          lastError = error?.message || 'Debug capture write failed';
          notify();
        });
        notify();
        return true;
      } catch (error) {
        lastError = error?.message || 'Debug capture failed';
        notify();
        return false;
      } finally {
        captureInFlight = false;
      }
    })();
    return captureSettled;
  }

  async function observe(frame) {
    lastFrame = frame;
    if (!active || !frame?.result) return false;
    if (captureCount >= maxCaptures) {
      await stop('capture-limit');
      return false;
    }
    const frameTime = frame.frameTimeMs ?? performance.now();
    const decision = getPoseCaptureDecision({ lastSignature, lastCaptureAt, stage: frame.stage, result: frame.result, frameTimeMs: frameTime, minIntervalMs });
    if (!decision.capture) return false;
    return capture(frame, decision.reason);
  }

  async function captureNow() {
    return capture(lastFrame, 'manual');
  }

  async function stop(reason = 'manual') {
    if (!active) return snapshot();
    active = false;
    await captureSettled;
    await pendingWrites;
    const sessionManifest = {
      schemaVersion: 1,
      sessionId,
      stoppedAt: new Date().toISOString(),
      stopReason: reason,
      outputMode,
      captureCount,
      captures: manifest,
    };
    try {
      await writeFile('session-manifest.json', JSON.stringify(sessionManifest, null, 2));
    } catch (error) {
      lastError = error?.message || 'Manifest export failed';
    }
    notify({ stopped: true, stopReason: reason });
    return snapshot({ stopped: true, stopReason: reason });
  }

  function dispose() {
    active = false;
    lastFrame = null;
    directoryHandle = null;
    sessionDirectory = null;
  }

  return {
    start,
    stop,
    observe,
    captureNow,
    dispose,
    get active() { return active; },
    get status() { return snapshot(); },
  };
}
