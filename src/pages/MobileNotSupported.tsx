import { Monitor } from 'lucide-react';
import Card from '../components/atoms/card/card';
import StateMessage from '../components/molecules/state-message/state-message';

/**
 * Rendered instead of the whole app below ~890px — see
 * `useIsSupportedViewport`. Deliberately its own minimal shell rather than
 * `Layout`: the header and the ambient glow layer are themselves part of
 * what overflows below this width, so this screen avoids both rather than
 * risk the same problem on the one screen meant to explain it.
 *
 * Same Card + StateMessage shape as `NotFound.tsx`, not a custom layout —
 * an earlier version added its own logo lockup above StateMessage's icon
 * and title, which just stacked two headers' worth of padding on top of
 * each other.
 */
export default function MobileNotSupported() {
  return (
    <div className="bg-page flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="mx-auto w-full max-w-sm">
        <StateMessage
          icon={Monitor}
          title="Built for a bigger screen"
          description="Sentinel's tables and charts need desktop-width space to work — please revisit this page on a laptop or desktop browser, at least 890px wide."
        />
      </Card>
    </div>
  );
}
