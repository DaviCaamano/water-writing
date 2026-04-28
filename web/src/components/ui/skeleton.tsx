import { cn } from '~utils/merge-css-classes';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-temp', className)}
      {...props}
    />
  );
}

export { Skeleton };
