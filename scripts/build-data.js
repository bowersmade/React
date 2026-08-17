/* eslint-disable */
/**
 * Build-time data transform.
 *
 * Stands in for the backend a real deployment would have. Reads the raw 389MB
 * scan export once and writes small, purpose-built artifacts the browser can
 * actually fetch:
 *
 *   public/data/index.json         { fields, rows } — one row per vulnerability
 *   public/data/descriptions.json  CVE -> description, deduplicated
 *   public/data/meta.json          the scanned group and repo lists
 *
 * The split is by access pattern, not by page. Descriptions are ~29% of the
 * source file but are only ever read one record at a time, so they are kept
 * out of the main payload.
 *
 * index.json is positional rather than an array of objects. Repeating 14 key
 * names on every one of 236,656 records costs ~37MB — a third of the payload,
 * and enough on its own to push the file past GitHub's 100MiB file limit. The
 * names are written once into `fields`; each row is the values in that order.
 * The reader derives its column positions from `fields` rather than hardcoding
 * them, so reordering this list cannot silently mismap the data.
 *
 * `hasFix` is not stored. It is exactly `fixStatus.startsWith('fixed')` for all
 * 236,656 records, so it is derived on read instead of shipped.
 *
 * meta.json deliberately carries no totals — every number on the dashboard
 * responds to the active filters, so it has to be counted from the in-scope
 * records at runtime anyway. What it does carry is the set of groups and repos
 * that were *scanned*, which cannot be recovered from the findings: a group
 * with zero vulnerabilities appears nowhere in index.json, and "scanned, all
 * clear" is a state the UI should be able to show rather than silently omit.
 *
 * Run with: npm run build:data
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'data', 'ui_demo.json');
const OUT_DIR = path.join(__dirname, '..', 'public', 'data');

/** Column order for index.json. Every row must match this exactly. */
const FIELDS = [
  'cve',
  'severity',
  'cvss',
  'packageName',
  'packageVersion',
  'packageType',
  'published',
  'fixStatus',
  'kaiStatus',
  'riskFactors',
  'link',
  'group',
  'repo',
  'image',
];

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

  // Seeded on entering each node in the source tree, so scopes with no findings
  // still appear — with a count of 0.
  const meta = { groups: {}, repos: {}, imageCount: 0 };

  console.log('Transforming…');

  for (const [groupName, group] of Object.entries(raw.groups ?? {})) {
    meta.groups[groupName] = meta.groups[groupName] ?? 0;

    for (const [repoName, repo] of Object.entries(group.repos ?? {})) {
      meta.repos[repoName] = meta.repos[repoName] ?? 0;

      for (const [imageVersion, image] of Object.entries(repo.images ?? {})) {
        const imageName = image.name ?? `${repoName}:${imageVersion}`;
        meta.imageCount += 1;

        for (const vuln of image.vulnerabilities ?? []) {
          const severity = vuln.severity ?? 'low';
          const published = (vuln.published ?? '').slice(0, 10);

          // Values only, in FIELDS order.
          records.push([
            vuln.cve ?? '',
            severity,
            vuln.cvss ?? 0,
            vuln.packageName ?? '',
            vuln.packageVersion ?? '',
            vuln.packageType ?? '',
            published,
            vuln.status ?? '',
            // '' when the finding has not been reviewed at all.
            vuln.kaiStatus ?? '',
            // riskFactors arrives as an object keyed by label with empty {}
            // values — effectively a serialised Set. Flatten to a plain array.
            Object.keys(vuln.riskFactors ?? {}),
            vuln.link ?? '',
            groupName,
            repoName,
            imageName,
          ]);

          if (vuln.cve && vuln.description && !descriptions[vuln.cve]) {
            descriptions[vuln.cve] = vuln.description;
          }

          meta.groups[groupName] += 1;
          meta.repos[repoName] += 1;
        }
      }
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const write = (name, data) => {
    const json = JSON.stringify(data);
    fs.writeFileSync(path.join(OUT_DIR, name), json);
    console.log(`  ${name.padEnd(20)} ${mb(Buffer.byteLength(json))}`);
  };

  console.log('Writing…');
  write('index.json', { fields: FIELDS, rows: records });
  write('descriptions.json', descriptions);
  write('meta.json', meta);

  const groupCount = Object.keys(meta.groups).length;
  const repoCount = Object.keys(meta.repos).length;
  const emptyGroups = Object.values(meta.groups).filter((n) => n === 0).length;
  const emptyRepos = Object.values(meta.repos).filter((n) => n === 0).length;

  console.log(
    `\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
      `${records.length.toLocaleString()} vulnerabilities across ` +
      `${meta.imageCount.toLocaleString()} images, ` +
      `${repoCount.toLocaleString()} repos, ` +
      `${groupCount} groups.`
  );

  if (emptyGroups || emptyRepos) {
    console.log(`  clean (0 findings): ${emptyGroups} groups, ${emptyRepos} repos.`);
  }
}

main();
