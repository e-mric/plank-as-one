export async function createMoveNetDetector({ onStatus } = {}) {
  if (typeof window === 'undefined') throw new Error('Pose detection is browser-only');
  onStatus?.('loading');

  const [poseDetection, tf] = await Promise.all([
    import('@tensorflow-models/pose-detection'),
    import('@tensorflow/tfjs-core'),
    import('@tensorflow/tfjs-converter'),
    import('@tensorflow/tfjs-backend-webgl'),
    import('@tensorflow/tfjs-backend-wasm'),
  ]).then(([poseDetectionModule, tfModule]) => [poseDetectionModule, tfModule]);

  try {
    await tf.setBackend('webgl');
  } catch {
    await tf.setBackend('wasm');
  }
  await tf.ready();

  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    },
  );
  onStatus?.('ready');

  return {
    estimatePoses: (video) => detector.estimatePoses(video),
    dispose: () => detector.dispose(),
  };
}

