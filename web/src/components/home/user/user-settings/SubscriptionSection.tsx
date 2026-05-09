import { SettingsColorMap } from '~types/components/settings-modal';
import { cn } from '~utils/merge-css-classes';
import { Tooltip, TooltipContent, TooltipTrigger } from '~components/ui/tooltip';
import {
  NeuDivider,
  NeuPillButton,
  SectionHeading,
  settingsPillActiveStyle,
  settingsRaisedStyle,
  settingsTrackStyle,
} from '~components/home/user/user-settings/index';
import { useUserStore } from '~store/useUserStore';
import { useState } from 'react';
import { apiRoutes } from '#types/shared/api-route';
import { queryApi } from '~lib/api';
import { Plan } from '#types/shared/enum/plan';

export const SubscriptionSection = ({ colorMap }: { colorMap: SettingsColorMap }) => {
  const { plan, deleteAccount } = useUserStore();
  const [yearly, setYearly] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isSubscribed = plan !== null;

  const handleCancelSubscription = async () => {
    try {
      await queryApi(apiRoutes.user.subscribe(), { body: { plan, yearly } });
    } catch (e) {
      console.error('Cancel failed:', e);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setShowDeleteConfirm(true);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className={cn('flex h-full flex-col items-center justify-center gap-5', 'text-center')}>
        <SectionHeading>Account deletion requested</SectionHeading>
        <p className='max-w-sm text-[14px] text-muted'>
          Your request has been received. Your account will be deleted within 3–5 business days.
        </p>
        <div className='w-40'>
          <NeuPillButton
            colorMap={colorMap}
            onClick={() => setShowDeleteConfirm(false)}
            variant='ghost'
          >
            Dismiss
          </NeuPillButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-5'>
        <SectionHeading>Plans</SectionHeading>

        {/* Billing cycle toggle — pill track */}
        <div className={cn('flex p-1 rounded-full gap-1', settingsTrackStyle)}>
          {[
            { v: false, label: 'Monthly' },
            { v: true, label: 'Yearly' },
          ].map(({ v, label }) => (
            <button
              key={label}
              type='button'
              onClick={() => setYearly(v)}
              className={cn(
                'px-4 py-1.5 rounded-full text-[12px] cursor-pointer transition-all',
                yearly === v && settingsPillActiveStyle,
                yearly === v
                  ? 'text-foreground font-semibold'
                  : 'bg-transparent text-muted font-medium',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <PlanCard
          colorMap={colorMap}
          description='30 notes from solace per day'
          isCurrent={plan === Plan.pro}
          monthlyPrice='$10'
          monthlySubtext='50% off for 3 months, then $10/month'
          name='Pro'
          yearly={yearly}
          yearlyPrice='$100'
          yearlySubtext='2 months free'
        />
        <PlanCard
          colorMap={colorMap}
          description='100 notes from solace per day'
          isCurrent={plan === Plan.max}
          monthlyPrice='$20'
          name='Max'
          yearly={yearly}
          yearlyPrice='$300'
          yearlySubtext='2 months free'
        />
      </div>

      <NeuDivider />

      <div className='space-y-3'>
        {isSubscribed && (
          <NeuPillButton
            colorMap={colorMap}
            onClick={handleCancelSubscription}
            variant='destructive'
          >
            Cancel subscription
          </NeuPillButton>
        )}

        {isSubscribed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='inline-block w-full'>
                <NeuPillButton colorMap={colorMap} disabled variant='ghost'>
                  Delete account
                </NeuPillButton>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>You must cancel your subscription before deleting your account.</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <NeuPillButton colorMap={colorMap} onClick={handleDeleteAccount} variant='destructive'>
            Delete account
          </NeuPillButton>
        )}
      </div>
    </div>
  );
};

const PlanCard = ({
  colorMap,
  description,
  isCurrent,
  monthlyPrice,
  monthlySubtext,
  name,
  yearly,
  yearlyPrice,
  yearlySubtext,
}: {
  colorMap: SettingsColorMap;
  description: string;
  isCurrent: boolean;
  monthlyPrice: string;
  monthlySubtext?: string;
  name: string;
  yearly: boolean;
  yearlyPrice: string;
  yearlySubtext?: string;
}) => {
  const price = yearly ? yearlyPrice : monthlyPrice;
  const period = yearly ? '/year' : '/month';
  const subtext = yearly ? yearlySubtext : monthlySubtext;

  return (
    <div className={cn('relative rounded-3xl p-5 space-y-4', settingsRaisedStyle)}>
      {isCurrent && (
        <div
          className={cn(
            'absolute -top-3 left-4 px-3 py-1',
            'rounded-full tracking-wide ',
            'text-[10px] font-semibold uppercase text-accent',
            settingsRaisedStyle,
          )}
        >
          Current Plan
        </div>
      )}

      <div>
        <h4 className='font-semibold text-[16px] text-foreground'>{name} Plan</h4>
        <p className='text-[12px] mt-1 text-muted'>{description}</p>
      </div>

      <div>
        <div className='text-[28px] font-bold tracking-tight text-foreground'>
          {price}
          <span className='text-[12px] font-normal ml-1 text-muted'>{period}</span>
        </div>
        {subtext && <p className='text-[11px] font-medium mt-1 text-success'>{subtext}</p>}
      </div>

      {!isCurrent && <NeuPillButton colorMap={colorMap}>Subscribe to {name}</NeuPillButton>}
    </div>
  );
};
