import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import StateMessage from '../components/molecules/state-message/state-message';
import Card from '../components/atoms/card/card';

/**
 * Catch-all route. Distinct from a data-load failure: the app is fine, the URL
 * is not, so the copy points somewhere useful rather than offering a retry.
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Card className="mx-auto max-w-xl">
      <StateMessage
        icon={Compass}
        title="Page not found"
        description="That address doesn't match anything in Sentinel. It may have moved, or the link may be incomplete."
        actionLabel="Back to dashboard"
        onAction={() => navigate('/')}
      />
    </Card>
  );
}
