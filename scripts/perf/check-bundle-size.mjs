/* global process */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const buildDir = path.resolve('public', 'build', 'assets');
const largestJsBudgetGzipBytes = 100 * 1024;
const topFiveJsBudgetGzipBytes = 260 * 1024;
const cssBudgetGzipBytes = 40 * 1024;

const formatKiB = (bytes) => `${(bytes / 1024).toFixed(2)} KiB`;

const readAsset = async (filePath) => {
    const fullPath = path.join(buildDir, filePath);
    const content = await readFile(fullPath);

    return {
        name: filePath,
        rawBytes: content.length,
        gzipBytes: gzipSync(content).length,
    };
};

const main = async () => {
    const assets = await readdir(buildDir);
    const jsAssets = assets.filter((name) => name.endsWith('.js'));
    const appCss = assets.find((name) => /^app-.*\.css$/.test(name));

    if (jsAssets.length === 0 || !appCss) {
        throw new Error(
            'Unable to find built JS/CSS bundles. Run `npm run build` first.',
        );
    }

    const [allJs, css] = await Promise.all([
        Promise.all(jsAssets.map((name) => readAsset(name))),
        readAsset(appCss),
    ]);
    const topFiveJs = allJs
        .sort((a, b) => b.gzipBytes - a.gzipBytes)
        .slice(0, 5);
    const largestJs = topFiveJs[0];
    const topFiveTotal = topFiveJs.reduce(
        (sum, asset) => sum + asset.gzipBytes,
        0,
    );

    console.log(
        `[perf] largest js (${largestJs.name}) raw=${formatKiB(largestJs.rawBytes)} gzip=${formatKiB(largestJs.gzipBytes)} budget=${formatKiB(largestJsBudgetGzipBytes)}`,
    );
    console.log(
        `[perf] top5 js gzip total=${formatKiB(topFiveTotal)} budget=${formatKiB(topFiveJsBudgetGzipBytes)}`,
    );
    console.log(
        `[perf] app css raw=${formatKiB(css.rawBytes)} gzip=${formatKiB(css.gzipBytes)} budget=${formatKiB(cssBudgetGzipBytes)}`,
    );

    const errors = [];

    if (largestJs.gzipBytes > largestJsBudgetGzipBytes) {
        errors.push(
            `Largest JS chunk budget exceeded by ${formatKiB(largestJs.gzipBytes - largestJsBudgetGzipBytes)}.`,
        );
    }

    if (topFiveTotal > topFiveJsBudgetGzipBytes) {
        errors.push(
            `Top 5 JS chunks budget exceeded by ${formatKiB(topFiveTotal - topFiveJsBudgetGzipBytes)}.`,
        );
    }

    if (css.gzipBytes > cssBudgetGzipBytes) {
        errors.push(
            `CSS bundle budget exceeded by ${formatKiB(css.gzipBytes - cssBudgetGzipBytes)}.`,
        );
    }

    if (errors.length > 0) {
        throw new Error(errors.join(' '));
    }
};

main().catch((error) => {
    console.error(`[perf] ${error.message}`);
    process.exit(1);
});
