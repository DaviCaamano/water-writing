'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '~components/ui/dialog';
import { Button } from '~components/ui/button';
import { Input } from '~components/ui/input';
import { Label } from '~components/ui/label';
import { Switch } from '~components/ui/switch';
import { Skeleton } from '~components/ui/skeleton';
import { Separator } from '~components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '~components/ui/tooltip';
import { Check, Pencil, X } from 'lucide-react';
import { useUserStore } from '~store/useUserStore';
import { useBillingHistoryQuery } from '~lib/queries/billing';
import { queryApi } from '~lib/api';
import { Plan } from '#types/shared/enum/plan';
import { SettingsSection } from '~types/components/settings-modal';
import { apiRoutes } from '#types/shared/api-route';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: SettingsSection;
}

export function SettingsModal({
  open,
  onOpenChange,
  initialSection = SettingsSection.general,
}: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <SettingsModalContent key={initialSection} initialSection={initialSection} /> : null}
    </Dialog>
  );
}

function SettingsModalContent({ initialSection }: { initialSection: SettingsSection }) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  const sections: { key: SettingsSection; label: string }[] = [
    { key: SettingsSection.general, label: 'General' },
    { key: SettingsSection.plan, label: 'Plan' },
    { key: SettingsSection.billing, label: 'Billing' },
  ];

  return (
    <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0 flex">
      <nav className="w-52 border-r p-6 flex flex-col gap-1 shrink-0">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
              activeSection === s.key ? 'font-bold bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === SettingsSection.general && <GeneralSection />}
        {activeSection === SettingsSection.plan && <SubscriptionSection />}
        {activeSection === SettingsSection.billing && <BillingSection />}
      </div>
    </DialogContent>
  );
}

/* General Section */

function GeneralSection() {
  const { firstName, lastName, email, updateName } = useUserStore();
  const [editingName, setEditingName] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');

  const startNameEdit = () => {
    setEditFirst(firstName);
    setEditLast(lastName);
    setEditingName(true);
  };

  const saveName = async () => {
    if (editFirst !== firstName || editLast !== lastName) {
      await updateName(editFirst, editLast);
    }
    setEditingName(false);
  };

  const cancelNameEdit = () => {
    setEditFirst(firstName);
    setEditLast(lastName);
    setEditingName(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Profile</h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {editingName ? (
              <>
                <div className="flex gap-2 flex-1">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs text-muted-foreground">First Name</Label>
                    <Input value={editFirst} onChange={(e) => setEditFirst(e.target.value)} />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs text-muted-foreground">Last Name</Label>
                    <Input value={editLast} onChange={(e) => setEditLast(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-1 mt-5">
                  <Button size="icon" variant="ghost" onClick={saveName}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelNameEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-base">
                  {firstName} {lastName}
                </p>
                <Button size="icon" variant="ghost" onClick={startNameEdit}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="text-sm">{email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Subscription Section */

function SubscriptionSection() {
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
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <h3 className="text-lg font-semibold">Account Deletion Requested</h3>
        <p className="text-muted-foreground max-w-sm">
          Your request has been received. Your account will be deleted within 3-5 business days.
        </p>
        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
          Dismiss
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Plans</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className={!yearly ? 'font-semibold' : 'text-muted-foreground'}>Monthly</span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={yearly ? 'font-semibold' : 'text-muted-foreground'}>Yearly</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Pro Plan */}
        <div className="relative border rounded-lg p-5 space-y-4">
          {plan === Plan.pro && (
            <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              Your Current Plan
            </div>
          )}
          <div>
            <h4 className="font-semibold text-base">Pro Plan</h4>
            <p className="text-muted-foreground text-sm mt-1">30 notes from solace per day</p>
          </div>
          {yearly ? (
            <div>
              <div className="text-3xl font-bold">
                $100<span className="text-sm font-normal text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-green-600 font-medium mt-1">2 months free</p>
            </div>
          ) : (
            <div>
              <div className="text-3xl font-bold">
                $5<span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-green-600 font-medium mt-1">
                50% off for 3 months, then $10/month
              </p>
            </div>
          )}
          {plan !== Plan.pro && <Button className="w-full">Subscribe to Pro</Button>}
        </div>

        {/* Max Plan */}
        <div className="relative border rounded-lg p-5 space-y-4">
          {plan === Plan.max && (
            <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              Your Current Plan
            </div>
          )}
          <div>
            <h4 className="font-semibold text-base">Max Plan</h4>
            <p className="text-muted-foreground text-sm mt-1">100 notes from solace per day</p>
          </div>
          {yearly ? (
            <div>
              <div className="text-3xl font-bold">
                $300<span className="text-sm font-normal text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-green-600 font-medium mt-1">2 months free</p>
            </div>
          ) : (
            <div>
              <div className="text-3xl font-bold">
                $20<span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </div>
          )}
          {plan !== Plan.max && <Button className="w-full">Subscribe to Max</Button>}
        </div>
      </div>

      <Separator />

      {isSubscribed && (
        <Button variant="destructive" className="w-full" onClick={handleCancelSubscription}>
          Cancel Subscription
        </Button>
      )}

      <div>
        {isSubscribed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block w-full">
                <Button
                  variant="outline"
                  className="w-full bg-muted text-muted-foreground"
                  disabled
                >
                  Delete Account
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>You must cancel your subscription before deleting your account.</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        )}
      </div>
    </div>
  );
}

/* Billing Section */

function BillingSection() {
  const { userId } = useUserStore();
  const { data: history = [], isLoading } = useBillingHistoryQuery(userId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Card on File</h3>
          <Skeleton className="h-10 w-72" />
        </div>
        <Separator />
        <div>
          <h3 className="text-lg font-semibold mb-3">Payment History</h3>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Card on File</h3>
        <p className="text-sm text-muted-foreground">No card on file</p>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-3">Payment History</h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground px-2">
              <span>Date</span>
              <span>Plan</span>
              <span>Amount</span>
            </div>
            {history.map((entry) => (
              <div
                key={entry.billingId}
                className="grid grid-cols-3 items-center text-sm px-2 py-2 rounded hover:bg-accent/50"
              >
                <span>{new Date(entry.billedAt).toLocaleDateString()}</span>
                <span>
                  {entry.planType}
                  {entry.isYearPlan ? ' (yearly)' : ''}
                </span>
                <span>${(entry.amountCents / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No payment history</p>
        )}
      </div>
    </div>
  );
}
