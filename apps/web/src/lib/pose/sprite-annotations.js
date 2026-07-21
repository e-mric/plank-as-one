function annotationUrl(frame) {
  if (frame.annotationSrc) return frame.annotationSrc;
  if (typeof frame.src === 'string' && frame.src.endsWith('.png')) return `${frame.src}.json`;
  throw new Error(`Sprite frame ${frame.id || 'unknown'} has no annotation URL.`);
}

function hasRequiredPoint(points, side, joint) {
  const camel = `${side}${joint[0].toUpperCase()}${joint.slice(1)}`;
  const value = points?.[`${side}_${joint}`] ?? points?.[camel] ?? points?.[joint];
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(Number(value[0]))
    && Number.isFinite(Number(value[1]));
}

function validateAnnotation(annotation, frame, manifest) {
  const viewport = manifest.atlas?.viewport || 480;
  if (annotation?.image?.name !== `${frame.id}.png`) {
    throw new Error(`Annotation image mismatch for ${frame.id}.`);
  }
  if (annotation.image.width !== viewport || annotation.image.height !== viewport) {
    throw new Error(`Annotation dimensions must be ${viewport}x${viewport} for ${frame.id}.`);
  }
  const side = frame.side || 'left';
  const missing = (manifest.requiredPoints || [])
    .filter((joint) => !hasRequiredPoint(annotation.points, side, joint));
  if (frame.matchable !== false && missing.length) {
    throw new Error(`Annotation ${frame.id} is missing: ${missing.join(', ')}.`);
  }
  return annotation.points || {};
}

export async function loadSpriteAnnotations(manifest, { fetcher = fetch } = {}) {
  const frames = await Promise.all(manifest.frames.map(async (frame) => {
    const response = await fetcher(annotationUrl(frame));
    if (!response.ok) throw new Error(`Could not load sprite annotation for ${frame.id}.`);
    const annotation = await response.json();
    return { ...frame, points: validateAnnotation(annotation, frame, manifest) };
  }));
  return { ...manifest, frames };
}

