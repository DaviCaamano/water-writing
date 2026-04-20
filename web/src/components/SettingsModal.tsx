'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, Check, X, Plus } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { api } from '@/lib/api';
import type { BillingResponse, BillingHistoryEntry, CardInfo } from '@/types';

type SettingsSection = 'general' | 'subscription' | 'billing';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: SettingsSection;
}

export function SettingsModal({ open, onOpenChange, initialSection = 'general' }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  useEffect(() => {
    if (open) {
      setActiveSection(initialSection);
    }
  }, [open, initialSection]);

  const sections: { key: SettingsSection; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'billing', label: 'Billing' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0 flex">
        <nav className="w-52 border-r p-6 flex flex-col gap-1 shrink-0">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                activeSection === s.key
                  ? 'font-bold bg-accent'
                  : 'hover:bg-accent/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'general' && <GeneralSection />}
          {activeSection === 'subscription' && <SubscriptionSection />}
          {activeSection === 'billing' && <BillingSection />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────── General Section ─────────────────────── */

function GeneralSection() {
  const { firstName, lastName, email, genres, updateName, updateGenres } = useUserStore();
  const [editingName, setEditingName] = useState(false);
  const [editFirst, setEditFirst] = useState(firstName);
  const [editLast, setEditLast] = useState(lastName);
  const [newGenre, setNewGenre] = useState('');

  useEffect(() => {
    setEditFirst(firstName);
    setEditLast(lastName);
  }, [firstName, lastName]);

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

  const addGenre = async () => {
    const trimmed = newGenre.trim();
    if (trimmed && !genres.includes(trimmed)) {
      await updateGenres([...genres, trimmed]);
      setNewGenre('');
    }
  };

  const removeGenre = async (genre: string) => {
    await updateGenres(genres.filter((g) => g !== genre));
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
                    <Input
                      value={editFirst}
                      onChange={(e) => setEditFirst(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs text-muted-foreground">Last Name</Label>
                    <Input
                      value={editLast}
                      onChange={(e) => setEditLast(e.target.value)}
                    />
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
                <Button size="icon" variant="ghost" onClick={() => setEditingName(true)}>
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

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-3">Genres</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {genres.map((genre) => (
            <Badge key={genre} variant="secondary" className="gap-1 pr-1">
              {genre}
              <button
                onClick={() => removeGenre(genre)}
                className="ml-1 hover:bg-accent rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {genres.length === 0 && (
            <p className="text-sm text-muted-foreground">No genres selected</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a genre..."
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGenre()}
            className="max-w-xs"
          />
          <Button size="icon" variant="outline" onClick={addGenre}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Subscription Section ─────────────────────── */

function SubscriptionSection() {
  const { subscription, deleteAccount } = useUserStore();
  const [yearly, setYearly] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isSubscribed = subscription !== 'none';

  const handleCancelSubscription = async () => {
    try {
      await api('/user/cancel-subscription', { method: 'POST' });
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
          {subscription === 'pro' && (
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
          {subscription !== 'pro' && (
            <Button className="w-full">Subscribe to Pro</Button>
          )}
        </div>

        {/* Max Plan */}
        <div className="relative border rounded-lg p-5 space-y-4">
          {subscription === 'max' && (
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
          {subscription !== 'max' && (
            <Button className="w-full">Subscribe to Max</Button>
          )}
        </div>
      </div>

      <Separator />

      {isSubscribed && (
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleCancelSubscription}
        >
          Cancel Subscription
        </Button>
      )}

      <div>
        {isSubscribed ? (
          <Tooltip>
            <TooltipTrigger render={<span className="inline-block w-full" />}>
              <Button variant="outline" className="w-full bg-muted text-muted-foreground" disabled>
                Delete Account
              </Button>
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

/* ─────────────────────── Billing Section ─────────────────────── */

function BillingSection() {
  const { accountId } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<CardInfo | null>(null);
  const [history, setHistory] = useState<BillingHistoryEntry[]>([]);

  const fetchBilling = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const data = await api<BillingResponse>(`/users/billing/history/${accountId}`);
      setCard(data.card);
      setHistory(data.history);
    } catch (e) {
      console.error('Failed to load billing:', e);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  if (loading) {
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
        {card ? (
          <div className="flex items-center gap-3">
            <span className="text-sm">
              <span className="capitalize font-medium">{card.network}</span> ending in{' '}
              <span className="font-mono">{card.last4}</span>
            </span>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No card on file</p>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-3">Payment History</h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground px-2">
              <span>Date</span>
              <span>Amount</span>
              <span />
            </div>
            {history.map((entry, i) => (
              <div
                key={i}
                className="grid grid-cols-3 items-center text-sm px-2 py-2 rounded hover:bg-accent/50"
              >
                <span>{entry.date}</span>
                <span>${entry.amount.toFixed(2)}</span>
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 text-sm"
                >
                  More Details
                </a>
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
