import { Columns3, Download, LineChart, X } from 'lucide-react';
import Button from '../../atoms/button/button';
import IconButton from '../../atoms/icon-button/icon-button';
import { Typography } from '../../foundations/typography/typography';
import { cn } from '../../../utils/cn';

export interface TableToolbarProps {
  /** How many rows are ticked. Zero shows the default actions. */
  selectedCount: number;
  onClearSelection: () => void;
  onCompare?: () => void;
  onExport?: () => void;
  onViewTrend?: () => void;
  /** Beyond this the comparison view switches to a table; used for the hint. */
  compareLimit?: number;
  className?: string;
}

/**
 * The row of actions above the table.
 *
 * Swaps between two modes rather than showing everything at once. With nothing
 * selected it offers what you can do with the current view — export it, chart
 * it. With rows selected it offers what you can do with them, and says how many
 * so the count is never a surprise when you hit Compare.
 */
export default function TableToolbar({
  selectedCount,
  onClearSelection,
  onCompare,
  onExport,
  onViewTrend,
  compareLimit = 4,
  className = '',
}: TableToolbarProps) {
  const hasSelection = selectedCount > 0;

  if (hasSelection) {
    return (
      <div
        data-testid="sn-table-toolbar"
        className={cn(
          'border-accent/30 bg-accent/10 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2',
          className
        )}
      >
        <Typography size="body-sm" aria-live="polite">
          <span className="font-semibold">{selectedCount}</span> selected
        </Typography>

        {selectedCount > compareLimit ? (
          <Typography size="caption" color="muted">
            Over {compareLimit} — comparison will show as a table
          </Typography>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="primary" icon={Columns3} onClick={onCompare}>
            Compare
          </Button>
          <IconButton icon={X} label="Clear selection" size="sm" onClick={onClearSelection} />
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="sn-table-toolbar"
      className={cn('flex flex-wrap items-center justify-end gap-2', className)}
    >
      {onViewTrend ? (
        <Button size="sm" icon={LineChart} onClick={onViewTrend}>
          Trend Analysis
        </Button>
      ) : null}
      {onExport ? (
        <Button size="sm" icon={Download} onClick={onExport}>
          Export CSV
        </Button>
      ) : null}
    </div>
  );
}
