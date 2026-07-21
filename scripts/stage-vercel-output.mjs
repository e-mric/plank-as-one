import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(repositoryRoot, 'apps/web/.vercel/output');
const destination = resolve(repositoryRoot, '.vercel/output');

if (!existsSync(resolve(source, 'config.json'))) {
  throw new Error(`Vercel adapter output is missing at ${source}`);
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true, force: true, dereference: true });

function materializeLinks(directory) {
  for (const entry of readdirSync(directory)) {
    const outputPath = resolve(directory, entry);
    const stats = lstatSync(outputPath);
    if (stats.isSymbolicLink()) {
      const sourcePath = resolve(source, relative(destination, outputPath));
      const sourceTarget = realpathSync(sourcePath);
      rmSync(outputPath, { recursive: true, force: true });
      cpSync(sourceTarget, outputPath, { recursive: true, force: true, dereference: true });
      materializeLinks(outputPath);
    } else if (stats.isDirectory()) {
      materializeLinks(outputPath);
    }
  }
}

materializeLinks(destination);
