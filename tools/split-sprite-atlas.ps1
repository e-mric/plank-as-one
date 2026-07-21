param(
  [string]$AtlasPath,
  [string]$ManifestPath,
  [string]$OutputDirectory,
  [int]$WhiteThreshold = 210
)

$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
if (-not $AtlasPath) {
  $AtlasPath = Join-Path $repositoryRoot 'apps/web/static/poses/hf-chara.png'
}
if (-not $ManifestPath) {
  $ManifestPath = Join-Path $repositoryRoot 'apps/web/src/lib/pose/sprite-states.json'
}
if (-not $OutputDirectory) {
  $OutputDirectory = Join-Path $repositoryRoot 'apps/web/static/poses/hf-chara'
}

$AtlasPath = [System.IO.Path]::GetFullPath($AtlasPath)
$ManifestPath = [System.IO.Path]::GetFullPath($ManifestPath)
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)

if (-not (Test-Path -LiteralPath $AtlasPath -PathType Leaf)) {
  throw "Atlas not found: $AtlasPath"
}
if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf)) {
  throw "Manifest not found: $ManifestPath"
}

Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class SpriteAtlasExporter
{
    private static bool IsBackground(byte[] pixels, int offset, int threshold)
    {
        return pixels[offset + 2] >= threshold &&
               pixels[offset + 1] >= threshold &&
               pixels[offset] >= threshold;
    }

    public static void ExportFrame(
        Bitmap atlas,
        string outputPath,
        int sourceX,
        int sourceY,
        int sourceWidth,
        int sourceHeight,
        int canvasSize,
        int bottomPadding,
        int whiteThreshold)
    {
        if (sourceWidth > canvasSize || sourceHeight + bottomPadding > canvasSize)
            throw new ArgumentException("The source frame does not fit inside the output canvas.");

        Rectangle sourceRectangle = new Rectangle(sourceX, sourceY, sourceWidth, sourceHeight);
        using (Bitmap frame = atlas.Clone(sourceRectangle, PixelFormat.Format32bppArgb))
        {
            Rectangle frameRectangle = new Rectangle(0, 0, frame.Width, frame.Height);
            BitmapData data = frame.LockBits(frameRectangle, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);

            try
            {
                int stride = Math.Abs(data.Stride);
                byte[] pixels = new byte[stride * frame.Height];
                Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);

                bool[] background = new bool[frame.Width * frame.Height];
                Queue<int> queue = new Queue<int>();

                Action<int, int> enqueue = (x, y) =>
                {
                    int index = y * frame.Width + x;
                    if (background[index]) return;

                    int row = data.Stride >= 0 ? y : frame.Height - 1 - y;
                    int offset = row * stride + x * 4;
                    if (!IsBackground(pixels, offset, whiteThreshold)) return;

                    background[index] = true;
                    queue.Enqueue(index);
                };

                for (int x = 0; x < frame.Width; x++)
                {
                    enqueue(x, 0);
                    enqueue(x, frame.Height - 1);
                }
                for (int y = 0; y < frame.Height; y++)
                {
                    enqueue(0, y);
                    enqueue(frame.Width - 1, y);
                }

                while (queue.Count > 0)
                {
                    int index = queue.Dequeue();
                    int x = index % frame.Width;
                    int y = index / frame.Width;

                    for (int dy = -1; dy <= 1; dy++)
                    {
                        for (int dx = -1; dx <= 1; dx++)
                        {
                            if (dx == 0 && dy == 0) continue;
                            int nextX = x + dx;
                            int nextY = y + dy;
                            if (nextX >= 0 && nextX < frame.Width && nextY >= 0 && nextY < frame.Height)
                                enqueue(nextX, nextY);
                        }
                    }
                }

                // White areas between limbs can be fully enclosed by the sprite outline.
                // Remove only substantial enclosed matte regions, preserving tiny eye and
                // clothing highlights.
                bool[] examined = (bool[])background.Clone();
                for (int seed = 0; seed < examined.Length; seed++)
                {
                    if (examined[seed]) continue;

                    int seedX = seed % frame.Width;
                    int seedY = seed / frame.Width;
                    int seedRow = data.Stride >= 0 ? seedY : frame.Height - 1 - seedY;
                    int seedOffset = seedRow * stride + seedX * 4;
                    if (!IsBackground(pixels, seedOffset, whiteThreshold))
                    {
                        examined[seed] = true;
                        continue;
                    }

                    List<int> component = new List<int>();
                    Queue<int> componentQueue = new Queue<int>();
                    examined[seed] = true;
                    componentQueue.Enqueue(seed);

                    while (componentQueue.Count > 0)
                    {
                        int index = componentQueue.Dequeue();
                        component.Add(index);
                        int x = index % frame.Width;
                        int y = index / frame.Width;

                        for (int dy = -1; dy <= 1; dy++)
                        {
                            for (int dx = -1; dx <= 1; dx++)
                            {
                                if (dx == 0 && dy == 0) continue;
                                int nextX = x + dx;
                                int nextY = y + dy;
                                if (nextX < 0 || nextX >= frame.Width || nextY < 0 || nextY >= frame.Height)
                                    continue;

                                int nextIndex = nextY * frame.Width + nextX;
                                if (examined[nextIndex]) continue;
                                int nextRow = data.Stride >= 0 ? nextY : frame.Height - 1 - nextY;
                                int nextOffset = nextRow * stride + nextX * 4;
                                if (!IsBackground(pixels, nextOffset, whiteThreshold)) continue;

                                examined[nextIndex] = true;
                                componentQueue.Enqueue(nextIndex);
                            }
                        }
                    }

                    if (component.Count >= 12)
                    {
                        foreach (int index in component)
                            background[index] = true;
                    }
                }

                for (int y = 0; y < frame.Height; y++)
                {
                    int row = data.Stride >= 0 ? y : frame.Height - 1 - y;
                    for (int x = 0; x < frame.Width; x++)
                    {
                        if (!background[y * frame.Width + x]) continue;
                        int offset = row * stride + x * 4;
                        pixels[offset] = 0;
                        pixels[offset + 1] = 0;
                        pixels[offset + 2] = 0;
                        pixels[offset + 3] = 0;
                    }
                }

                Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
            }
            finally
            {
                frame.UnlockBits(data);
            }

            using (Bitmap canvas = new Bitmap(canvasSize, canvasSize, PixelFormat.Format32bppArgb))
            using (Graphics graphics = Graphics.FromImage(canvas))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.Clear(Color.Transparent);
                graphics.InterpolationMode = InterpolationMode.NearestNeighbor;
                graphics.PixelOffsetMode = PixelOffsetMode.Half;

                int targetX = (canvasSize - sourceWidth) / 2;
                int targetY = canvasSize - sourceHeight - bottomPadding;
                graphics.DrawImage(
                    frame,
                    new Rectangle(targetX, targetY, sourceWidth, sourceHeight),
                    new Rectangle(0, 0, sourceWidth, sourceHeight),
                    GraphicsUnit.Pixel);
                canvas.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
'@ -ReferencedAssemblies System.Drawing

$manifest = Get-Content -Raw -LiteralPath $ManifestPath | ConvertFrom-Json
$canvasSize = [int]$manifest.atlas.viewport
$bottomPadding = 6

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$atlas = [System.Drawing.Bitmap]::new($AtlasPath)
try {
  foreach ($frame in $manifest.frames) {
    $outputPath = Join-Path $OutputDirectory "$($frame.id).png"
    [SpriteAtlasExporter]::ExportFrame(
      $atlas,
      $outputPath,
      [int]$frame.bounds.x,
      [int]$frame.bounds.y,
      [int]$frame.bounds.width,
      [int]$frame.bounds.height,
      $canvasSize,
      $bottomPadding,
      $WhiteThreshold
    )
  }
}
finally {
  $atlas.Dispose()
}

Write-Output "Exported $($manifest.frames.Count) transparent sprite frames to $OutputDirectory"
