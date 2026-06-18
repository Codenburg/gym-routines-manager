import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
}

export function PageHeader({ title, description, actions, backHref }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6 px-4">
      {backHref && (
        <Link
          href={backHref}
          className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground uppercase truncate">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-1 truncate">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
