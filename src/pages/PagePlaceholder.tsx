import { Construction } from 'lucide-react';
import Card from '../components/atoms/card/card';
import StateMessage from '../components/molecules/state-message/state-message';

export interface PagePlaceholderProps {
  title: string;
  description: string;
}

/**
 * Stand-in for a route that exists but has no screen yet. Keeps navigation,
 * lazy-loading and URL state testable before the real page is written, and
 * makes it obvious which routes are still empty.
 *
 * Delete each usage as its page lands.
 */
export default function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <Card className="mx-auto max-w-xl">
      <StateMessage icon={Construction} title={title} description={description} />
    </Card>
  );
}
