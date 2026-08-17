import PagePlaceholder from './PagePlaceholder';

/**
 * The full trend view. Same `buildTrendAnalysis` the dashboard uses, but over
 * all 118 months rather than the recent window, and driven by whatever filters
 * the list page was carrying.
 */
export default function TrendAnalysis() {
  return (
    <PagePlaceholder
      title="Trend analysis"
      description="The full 118-month history, filtered by whatever you were looking at on the list."
    />
  );
}
