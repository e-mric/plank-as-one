export function startPoseInference({ video, detector, onPose, onError, intervalMs = 50 }) {
  let stopped = false;
  let inferenceRunning = false;
  let lastInferenceAt = -Infinity;
  let requestId = null;

  const schedule = (callback) => {
    if (typeof video.requestVideoFrameCallback === 'function') {
      requestId = video.requestVideoFrameCallback((now) => callback(now));
    } else {
      requestId = window.requestAnimationFrame((now) => callback(now));
    }
  };

  const cancel = () => {
    if (requestId === null) return;
    if (typeof video.cancelVideoFrameCallback === 'function' && typeof video.requestVideoFrameCallback === 'function') {
      video.cancelVideoFrameCallback(requestId);
    } else {
      window.cancelAnimationFrame(requestId);
    }
    requestId = null;
  };

  async function processFrame(now) {
    if (stopped) return;
    if (!inferenceRunning && now - lastInferenceAt >= intervalMs && video.readyState >= 2) {
      inferenceRunning = true;
      lastInferenceAt = now;
      try {
        const poses = await detector.estimatePoses(video);
        if (!stopped) onPose(poses, now);
      } catch (error) {
        if (!stopped) onError?.(error);
      } finally {
        inferenceRunning = false;
      }
    }
    if (!stopped) schedule(processFrame);
  }

  schedule(processFrame);
  return () => { stopped = true; cancel(); };
}

