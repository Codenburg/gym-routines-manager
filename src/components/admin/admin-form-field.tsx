const variantStyles = {
  default: {
    wrapper: 'space-y-2',
    description: '',
  },
  'with-description': {
    wrapper: 'space-y-2',
    description:
      'mt-1 p-3 bg-muted/50 rounded-lg border border-border text-muted-foreground text-xs',
  },
} as const;

interface AdminFormFieldProps {
  variant: 'default' | 'with-description';
  label: string;
  error?: string;
  description?: string;
  children: React.ReactNode;
}

export function AdminFormField({
  variant,
  label,
  error,
  description,
  children,
}: AdminFormFieldProps) {
  const styles = variantStyles[variant];

  return (
    <div className={styles.wrapper}>
      <label className="text-foreground text-sm font-medium">{label}</label>
      {variant === 'with-description' && description && <p className={styles.description}>{description}</p>}
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
