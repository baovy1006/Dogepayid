import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => (
    <div className="flex flex-col items-center py-24 text-center">
        <p className="font-display text-8xl text-primary">404</p>
        <p className="mt-3 text-muted-foreground">This page doesn't exist.</p>
        <Button asChild className="mt-6 rounded-full">
            <Link to="/">Back to Home</Link>
        </Button>
    </div>
);

export default NotFound;
