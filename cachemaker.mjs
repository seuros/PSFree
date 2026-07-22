const OUTPUT = 'PSFree.manifest';
const SELF = 'cachemaker.mjs';

const EXCLUDED_DIRS = new Set(['.venv', '.git', 'noneed', '.github', 'node_modules']);
const EXCLUDED_EXTS = new Set([
    'bat', 'txt', 'exe', 'mp4', 'py', 'bak', 'zip',
    'mp3', 'sh', 'h', 'c', 'o', 'ld', 'md', 'd', 'json',
]);
const EXCLUDED_FILES = new Set(['.gitignore', 'COPYING', 'LICENSE', '.prettierrc', OUTPUT, SELF]);

const keep = (rel) => {
    const segs = rel.split('/');
    if (segs.some((s) => EXCLUDED_DIRS.has(s))) return false;
    const name = segs.at(-1);
    if (EXCLUDED_FILES.has(name)) return false;
    return !EXCLUDED_EXTS.has(name.split('.').at(-1).toLowerCase());
};

const paths = [...new Bun.Glob('**/*').scanSync({ dot: true })].filter(keep).sort();

const hasher = new Bun.CryptoHasher('sha256');
for (const rel of paths) {
    hasher.update(rel + '\0');
    hasher.update(await Bun.file(rel).bytes());
    hasher.update('\0');
}
const version = hasher.digest('hex').slice(0, 16);

const manifest = `CACHE MANIFEST\n# content ${version}\n\nCACHE:\n${paths.join('\n')}\n\nNETWORK:\n*\n`;
await Bun.write(OUTPUT, manifest);
console.log(`Wrote ${OUTPUT} (${paths.length} files, version ${version})`);
