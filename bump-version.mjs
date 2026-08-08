const TARGETS = ['index.html', 'exploit.html'];

const { buildTag } = await Bun.file('package.json').json();

for (const path of TARGETS) {
    const src = await Bun.file(path).text();
    const out = src.replace(/build \d{4}-\d{2}-\d{2}\.\d+/g, `build ${buildTag}`);
    await Bun.write(path, out);
    console.log(`${path}: build ${buildTag}`);
}
