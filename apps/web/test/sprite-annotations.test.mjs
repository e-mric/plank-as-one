import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadSpriteAnnotations } from '../src/lib/pose/sprite-annotations.js';

const points = {
  left_shoulder: [300, 300],
  left_elbow: [320, 360],
  left_wrist: [340, 420],
  left_hip: [220, 340],
  left_knee: [140, 380],
  left_ankle: [60, 410],
};

const manifest = {
  atlas: { viewport: 480 },
  requiredPoints: ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'],
  frames: [{ id: 'plank', src: '/poses/hf-chara/plank.png', side: 'left', points: {} }],
};

test('individual sprite JSON annotations are loaded without coordinate conversion', async () => {
  const requested = [];
  const loaded = await loadSpriteAnnotations(manifest, {
    fetcher: async (url) => {
      requested.push(url);
      return {
        ok: true,
        async json() {
          return { image: { name: 'plank.png', width: 480, height: 480 }, points };
        },
      };
    },
  });

  assert.deepEqual(requested, ['/poses/hf-chara/plank.png.json']);
  assert.deepEqual(loaded.frames[0].points, points);
  assert.equal(loaded.frames[0].points.left_hip[0], 220);
  assert.deepEqual(manifest.frames[0].points, {});
});

test('a matchable annotation must contain every required joint', async () => {
  await assert.rejects(
    loadSpriteAnnotations(manifest, {
      fetcher: async () => ({
        ok: true,
        async json() {
          return {
            image: { name: 'plank.png', width: 480, height: 480 },
            points: { ...points, left_ankle: undefined },
          };
        },
      }),
    }),
    /missing: ankle/,
  );
});

test('every repository sprite loads its adjacent annotation JSON', async () => {
  const repositoryManifest = JSON.parse(
    await readFile(new URL('../src/lib/pose/sprite-states.json', import.meta.url), 'utf8'),
  );
  const loaded = await loadSpriteAnnotations(repositoryManifest, {
    fetcher: async (url) => {
      try {
        const text = await readFile(new URL(`../static${url}`, import.meta.url), 'utf8');
        return { ok: true, async json() { return JSON.parse(text); } };
      } catch {
        return { ok: false };
      }
    },
  });

  assert.equal(loaded.frames.length, 21);
  assert.equal(loaded.frames.filter((frame) => frame.matchable !== false).length, 18);
  assert.ok(loaded.frames.every((frame) => Object.keys(frame.points).length === 17));
});
