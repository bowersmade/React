/* eslint-disable */
/**
 * Build-time data transform.
 *
 * Stands in for the backend a real deployment would have. Reads the raw 389MB
 * scan export once and writes small, purpose-built artifacts the browser can
 * actually fetch:
 *
 *   public/data/index.json         one record per vulnerability, only the
 *                                  fields the list and filters need
 *   public/data/meta.json          pre-computed aggregates for the dashboard
 *   public/data/descriptions.json  CVE -> description, deduplicated
 *
 * The split is by access pattern, not by page. Descriptions are ~29% of the
 * source file but are only ever read one record at a time, so they are kept
 * out of the main payload. Aggregates are computed here once rather than in
 * the browser on every load.
 *
 * Run with: npm run build:data
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'data', 'ui_demo.json');
const OUT_DIR = path.join(__dirname, '..', 'public', 'data');

const mb = (bytes) => `${(bytes / 1e6).toFixed(2)} MB`;

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(
      [
        '',
        'Source data not found.',
        '',
        `  expected: ${SOURCE}`,
        '',
        'ui_demo.json is ~389MB and is excluded from version control, so it is not',
        'part of a fresh clone. You only need it to regenerate the dashboard data.',
        '',
        'The generated files in public/data/ are committed, so `npm start` works',
        'without this script. Only run it if the raw scan export has changed.',
        '',
      ].join('\n')
    );
    process.exit(1);
  }

  console.log('Reading source…');
  const started = Date.now();
  const raw = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

  const records = [];
  const descriptions = {};

  const stats = {
    total: 0,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    byKaiStatus: { unreviewed: 0, manuallyCleared: 0, aiCleared: 0 },
    withFix: 0,
    counts: { groups: 0, repos: 0, images: 0 },
    riskFactors: {},
    trend: {}, // 'YYYY-MM' -> { critical, high, medium, low }
    byGroup: {},
    byRepo: {},
    packageTypes: {},
  };

  const bumpTrend = (month, severity) => {
    if (!stats.trend[month]) {
      stats.trend[month] = { critical: 0, high: 0, medium: 0, low: 0 };
    }
    stats.trend[month][severity] += 1;
  };

  console.log('Transforming…');

  for (const [groupName, group] of Object.entries(raw.groups ?? {})) {
    stats.counts.groups += 1;
    stats.byGroup[groupName] = 0;

    for (const [repoName, repo] of Object.entries(group.repos ?? {})) {
      stats.counts.repos += 1;
      stats.byRepo[repoName] = stats.byRepo[repoName] ?? 0;

      for (const [imageVersion, image] of Object.entries(repo.images ?? {})) {
        const imageName = image.name ?? `${repoName}:${imageVersion}`;
        stats.counts.images += 1;

        for (const vuln of image.vulnerabilities ?? []) {
          const severity = vuln.severity ?? 'low';
          const published = (vuln.published ?? '').slice(0, 10);
          const hasFix = (vuln.status ?? '').startsWith('fixed');

          records.push({
            cve: vuln.cve ?? '',
            severity,
            cvss: vuln.cvss ?? 0,
            packageName: vuln.packageName ?? '',
            packageVersion: vuln.packageVersion ?? '',
            packageType: vuln.packageType ?? '',
            published,
            fixStatus: vuln.status ?? '',
            hasFix,
            // '' when the finding has not been reviewed at all.
            kaiStatus: vuln.kaiStatus ?? '',
            // riskFactors arrives as an object keyed by label with empty {}
            // values — effectively a serialised Set. Flatten to a plain array.
            riskFactors: Object.keys(vuln.riskFactors ?? {}),
            link: vuln.link ?? '',
            group: groupName,
            repo: repoName,
            image: imageName,
          });

          if (vuln.cve && vuln.description && !descriptions[vuln.cve]) {
            descriptions[vuln.cve] = vuln.description;
          }

          stats.total += 1;
          if (stats.bySeverity[severity] !== undefined) stats.bySeverity[severity] += 1;
          if (hasFix) stats.withFix += 1;

          if (vuln.kaiStatus === 'invalid - norisk') stats.byKaiStatus.manuallyCleared += 1;
          else if (vuln.kaiStatus === 'ai-invalid-norisk') stats.byKaiStatus.aiCleared += 1;
          else stats.byKaiStatus.unreviewed += 1;

          stats.byGroup[groupName] += 1;
          stats.byRepo[repoName] += 1;

          const type = vuln.packageType ?? '';
          if (type) stats.packageTypes[type] = (stats.packageTypes[type] ?? 0) + 1;

          for (const factor of Object.keys(vuln.riskFactors ?? {})) {
            stats.riskFactors[factor] = (stats.riskFactors[factor] ?? 0) + 1;
          }

          if (published) bumpTrend(published.slice(0, 7), severity);
        }
      }
    }
  }

  // Sort risk factors by frequency so the dashboard can take the top N.
  stats.riskFactors = Object.fromEntries(
    Object.entries(stats.riskFactors).sort((a, b) => b[1] - a[1])
  );

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const write = (name, data) => {
    const json = JSON.stringify(data);
    fs.writeFileSync(path.join(OUT_DIR, name), json);
    console.log(`  ${name.padEnd(20)} ${mb(Buffer.byteLength(json))}`);
  };

  console.log('Writing…');
  write('index.json', records);
  write('meta.json', stats);
  write('descriptions.json', descriptions);

  console.log(
    `\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
      `${stats.total.toLocaleString()} vulnerabilities across ` +
      `${stats.counts.images.toLocaleString()} images, ` +
      `${stats.counts.repos.toLocaleString()} repos, ` +
      `${stats.counts.groups} groups.`
  );
}

main();
