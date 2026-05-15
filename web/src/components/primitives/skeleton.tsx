import { cn } from '~utils/merge-css-classes';

function Skeleton({
  className,
  'aria-label': ariaLabel = 'Loading',
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='skeleton'
      role='status'
      aria-busy='true'
      aria-label={ariaLabel}
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
