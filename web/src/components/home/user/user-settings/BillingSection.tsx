import { useUserStore } from '~store/useUserStore';
import { useBillingHistoryQuery } from '~lib/queries/billing';
import { NeuDivider, SectionHeading } from '~components/home/user/user-settings/index';
import { Skeleton } from '~components/primitives/skeleton';
import { cn } from '~utils/merge-css-classes';

export const BillingSection = () => {
  const { userId } = useUserStore();
  const { data: history = [], isLoading } = useBillingHistoryQuery(userId);

  if (isLoading) {
    return (
      <div>
        <SectionHeading>Card on file</SectionHeading>
        <div className={'rounded-full p-1 embossed'}>
          <Skeleton className='h-8 w-72 rounded-full' />
        </div>
        <NeuDivider />
        <SectionHeading>Payment history</SectionHeading>
        <div className='space-y-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-9 w-full rounded-full' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeading>Card on file</SectionHeading>
      <div className={'rounded-full px-5 py-2.5 text-[13px] text-muted embossed'}>
        No card on file
      </div>

      <NeuDivider />

      <SectionHeading>Payment history</SectionHeading>
      {history.length > 0 ? (
        <div className='space-y-2'>
          <div
            className={cn(
              'grid grid-cols-3 px-5 pb-1 text-[10px]',
              'font-semibold text-muted uppercase tracking-[0.18em]',
            )}
          >
            <span>Date</span>
            <span>Plan</span>
            <span>Amount</span>
          </div>
          {history.map((entry) => (
            <div
              key={entry.billingId}
              className={cn(
                'grid grid-cols-3 items-center rounded-full',
                'px-5 py-2.5 text-[13px]',
                'text-foreground embossed',
              )}
            >
              <span>{new Date(entry.billedAt).toLocaleDateString()}</span>
              <span>
                {entry.planType}
                {entry.isYearPlan ? ' · yearly' : ''}
              </span>
              <span className='tabular-nums'>${(entry.amountCents / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={'rounded-full px-5 py-2.5 text-[13px] text-muted embossed'}>
          No payment history
        </div>
      )}
    </div>
  );
};
