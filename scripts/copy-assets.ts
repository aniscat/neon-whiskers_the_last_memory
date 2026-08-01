/**
 * Copia los sprites de los packs descargados a `public/assets`, normalizando los
 * nombres (los originales son `IdleCattt.png`, `JumpCatttt.png`, etc.) y
 * descartando la basura de macOS (`__MACOSX`, `._*`, `.DS_Store`).
 *
 * Uso: npm run assets
 */
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CATS_SRC = join(ROOT, 'AllCatsDemo', 'AllCatsDemo');
const PROPS_SRC = join(ROOT, 'CatMaterialsDEMO', 'CatMaterialsDEMO');
const CATS_OUT = join(ROOT, 'public', 'assets', 'cats');
const PROPS_OUT = join(ROOT, 'public', 'assets', 'props');

/** Nombre de carpeta original -> id de variante usado en el juego. */
const CAT_VARIANTS: Record<string, string> = {
  Classical: 'classical',
  BlackCat: 'black',
  White: 'white',
  Brown: 'brown',
  Siamese: 'siamese',
  TigerCatFree: 'tiger',
  ThreeColorFree: 'threecolor',
  DemonicFree: 'demonic',
  EgyptCatFree: 'egypt',
  BatmanCatFree: 'batman',
  Xmas: 'xmas',
};

/** Nombre original -> nombre destino para los objetos. */
const PROP_FILES: Record<string, string> = {
  'Mouse-Sheet.png': 'mouse.png',
  'BlueBall-Sheet.png': 'ball-blue.png',
  'OrangeBall-Sheet.png': 'ball-orange.png',
  'PinkBall-Sheet.png': 'ball-pink.png',
  'CatBedBlue.png': 'cat-bed.png',
  'CatBowls.png': 'cat-bowls.png',
};

const isJunk = (name: string) => name.startsWith('._') || name === '.DS_Store';

async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Elige el PNG cuyo nombre empieza por `prefix`, prefiriendo el que no tenga " 2". */
function pickSheet(files: string[], prefix: string): string | undefined {
  const candidates = files
    .filter((f) => !isJunk(f) && f.toLowerCase().endsWith('.png'))
    .filter((f) => f.toLowerCase().startsWith(prefix));
  return candidates.find((f) => !f.includes(' 2')) ?? candidates[0];
}

async function copyCats() {
  let copied = 0;
  for (const [folder, variant] of Object.entries(CAT_VARIANTS)) {
    const src = join(CATS_SRC, folder);
    if (!(await exists(src))) {
      console.warn(`  ! falta la carpeta ${folder}, se omite`);
      continue;
    }
    const files = await readdir(src);
    const outDir = join(CATS_OUT, variant);
    await mkdir(outDir, { recursive: true });

    for (const [prefix, outName] of [
      ['idle', 'idle.png'],
      ['jump', 'jump.png'],
    ] as const) {
      const sheet = pickSheet(files, prefix);
      if (!sheet) {
        console.warn(`  ! ${folder}: no se encontró sheet "${prefix}"`);
        continue;
      }
      await copyFile(join(src, sheet), join(outDir, outName));
      copied++;
    }
    console.log(`  ${folder} -> cats/${variant}`);
  }
  return copied;
}

async function copyProps() {
  await mkdir(PROPS_OUT, { recursive: true });
  let copied = 0;
  for (const [srcName, outName] of Object.entries(PROP_FILES)) {
    const src = join(PROPS_SRC, srcName);
    if (!(await exists(src))) {
      console.warn(`  ! falta ${srcName}, se omite`);
      continue;
    }
    await copyFile(src, join(PROPS_OUT, outName));
    console.log(`  ${srcName} -> props/${outName}`);
    copied++;
  }
  return copied;
}

console.log('Copiando gatos...');
const cats = await copyCats();
console.log('Copiando objetos...');
const props = await copyProps();
console.log(`\nListo: ${cats} sheets de gato y ${props} objetos en public/assets.`);
