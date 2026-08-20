import { Component, type ErrorInfo, type ReactNode } from 'react';
import StateMessage from '../../molecules/state-message/state-message';
import Card from '../../atoms/card/card';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render/lifecycle errors anywhere below it in the tree and shows a
 * recoverable message instead of the router unmounting to a blank page.
 *
 * Must be a class component — `componentDidCatch`/`getDerivedStateFromError`
 * have no hook equivalent, since a thrown error unwinds past the point a
 * function component's hooks could still run.
 *
 * Placed once around the routed `<Suspense>` in `App.tsx`, alongside the
 * existing "one boundary is enough, only one route renders at a time"
 * reasoning already used for that Suspense.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No error-reporting service wired up — this is where one would go.
    console.error('Sentinel crashed:', error, info.componentStack);
  }

  /**
   * A full reload rather than clearing local state and re-rendering
   * `children`: most causes here are a bad response mid-fetch or a stale
   * chunk from a redeploy, and both need a fresh script/data load to
   * actually recover — retrying in place would just throw again.
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <Card className="mx-auto max-w-xl">
          <StateMessage
            variant="error"
            title="Something went wrong"
            description="Sentinel hit an unexpected error and couldn't continue. Reloading usually fixes it."
            actionLabel="Reload page"
            onAction={this.handleReload}
          />
        </Card>
      );
    }

    return this.props.children;
  }
}
