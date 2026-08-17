import PagePlaceholder from './PagePlaceholder';

/**
 * Side-by-side comparison of findings selected on the list page. Up to four in
 * the column layout; beyond that it falls back to a table.
 */
export default function Compare() {
  return (
    <PagePlaceholder
      title="Compare findings"
      description="Selected findings will appear side by side here — up to four in columns, more as a table."
    />
  );
}
