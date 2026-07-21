<script lang="ts">
  export let atlas: { src: string; width: number; height: number; viewport?: number };
  export let frame: { id: string; src?: string; bounds: { x: number; y: number; width: number; height: number } };
  export let alt = '';
  export let decorative = false;

  $: viewport = atlas.viewport || 480;
  $: frameX = (viewport - frame.bounds.width) / 2;
  $: frameY = viewport - frame.bounds.height - 6;
</script>

<svg
  class="sprite-avatar"
  viewBox={`0 0 ${viewport} ${viewport}`}
  role={decorative ? 'presentation' : 'img'}
  aria-label={decorative ? undefined : alt}
  aria-hidden={decorative ? 'true' : undefined}
  data-sprite-state={frame.id}
>
  {#if frame.src}
    <image href={frame.src} width={viewport} height={viewport} />
  {:else}
    <svg
      x={frameX}
      y={frameY}
      width={frame.bounds.width}
      height={frame.bounds.height}
      viewBox={`${frame.bounds.x} ${frame.bounds.y} ${frame.bounds.width} ${frame.bounds.height}`}
      overflow="hidden"
    >
      <image class="atlas-source" href={atlas.src} width={atlas.width} height={atlas.height} />
    </svg>
  {/if}
</svg>

<style>
  .sprite-avatar { display:block; width:100%; height:100%; overflow:visible; image-rendering:pixelated; }
  image { image-rendering:pixelated; }
  .atlas-source { mix-blend-mode:multiply; }
</style>
