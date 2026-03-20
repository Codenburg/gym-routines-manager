const variantStyles = {
  hero: 'bg-secondary border-border rounded-xl p-4',
  standard: 'bg-secondary border-border rounded-xl p-4',
  interactive:
    'bg-secondary border-border rounded-xl p-4 hover:border-ring hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer',
} as const;

interface AdminCardProps {
  variant: 'hero' | 'standard' | 'interactive';
  children: React.ReactNode;
  onClick?: () => void;
}

export function AdminCard({ variant, children, onClick }: AdminCardProps) {
  return (
    <div
      className={variantStyles[variant]}
      onClick={variant === 'interactive' ? onClick : undefined}
    >
      {children}
    </div>
  );
}
