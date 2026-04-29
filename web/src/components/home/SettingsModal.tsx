'use client';

import { useState } from 'react';
import { Dialog, DialogPortal, DialogOverlay } from '~components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Skeleton } from '~components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '~components/ui/tooltip';
import { Check, Pencil, X } from 'lucide-react';
import { WaterRipple } from '~components/visual-effects/WaterRipple';
import { useUserStore } from '~store/useUserStore';
import { useBillingHistoryQuery } from '~lib/queries/billing';
import { queryApi } from '~lib/api';
import { Plan } from '#types/shared/enum/plan';
import { SettingsSection } from '~types/components/settings-modal';
import { apiRoutes } from '#types/shared/api-route';

/* ── Neumorphic tokens (mirrors AuthDialog) ──────────────────── */

const NEU_BG = 'oklch(0.965 0.014 237)';
const TEXT = 'oklch(0.32 0.01 240)';
const MUTED = 'oklch(0.58 0.01 240)';
const ACCENT = 'oklch(0.45 0.06 240)';

const card: React.CSSProperties = {
    background: NEU_BG,
    boxShadow: '12px 12px 28px rgba(148,165,190,0.55), -12px -12px 28px rgba(255,255,255,0.88)',
};
const insetStyle: React.CSSProperties = {
    background: NEU_BG,
    boxShadow: 'inset 5px 5px 11px rgba(148,165,190,0.55), inset -5px -5px 11px rgba(255,255,255,0.88)',
};
const raisedSm: React.CSSProperties = {
    background: NEU_BG,
    boxShadow: '6px 6px 14px rgba(148,165,190,0.55), -6px -6px 14px rgba(255,255,255,0.88)',
};
const trackStyle: React.CSSProperties = {
    background: NEU_BG,
    boxShadow: 'inset 4px 4px 9px rgba(148,165,190,0.55), inset -4px -4px 9px rgba(255,255,255,0.88)',
};
const pillActive: React.CSSProperties = {
    background: NEU_BG,
    boxShadow: '4px 4px 10px rgba(148,165,190,0.55), -4px -4px 10px rgba(255,255,255,0.88)',
};

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
            {open ? (
                <SettingsModalContent
                    key={initialSection}
                    initialSection={initialSection}
                    onClose={() => onOpenChange(false)}
                />
            ) : null}
        </Dialog>
    );
}

function SettingsModalContent({
    initialSection,
    onClose,
}: {
    initialSection: SettingsSection;
    onClose: () => void;
}) {
    const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

    const sections: { key: SettingsSection; label: string }[] = [
        { key: SettingsSection.general, label: 'General' },
        { key: SettingsSection.plan, label: 'Plan' },
        { key: SettingsSection.billing, label: 'Billing' },
    ];

    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                aria-describedby={undefined}
                className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            >
                <div
                    className="w-[min(900px,92vw)] h-[80vh] rounded-[32px] p-8 flex gap-7 relative"
                    style={{ ...card, color: TEXT }}
                >
                    {/* Close */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-5 right-5 size-9 rounded-full flex items-center justify-center cursor-pointer transition-transform active:translate-y-px"
                        style={{ ...raisedSm, color: MUTED }}
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>

                    {/* Sidebar nav — pill rail */}
                    <nav className="w-48 shrink-0 flex flex-col gap-3 pt-1">
                        <DialogPrimitive.Title asChild>
                            <h2
                                className="text-[22px] font-bold tracking-tight pl-2 pb-2"
                                style={{ color: TEXT }}
                            >
                                Settings
                            </h2>
                        </DialogPrimitive.Title>

                        <div className="flex flex-col gap-2 p-1.5 rounded-[26px]" style={trackStyle}>
                            {sections.map((s) => {
                                const isActive = activeSection === s.key;
                                return (
                                    <button
                                        key={s.key}
                                        type="button"
                                        onClick={() => setActiveSection(s.key)}
                                        className="text-left px-4 py-2.5 rounded-full text-[13px] cursor-pointer transition-all duration-200"
                                        style={
                                            isActive
                                                ? { ...pillActive, color: TEXT, fontWeight: 600 }
                                                : { background: 'transparent', color: MUTED, fontWeight: 500 }
                                        }
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Content panel — inset surface */}
                    <div
                        className="flex-1 rounded-[24px] overflow-y-auto p-7"
                        style={insetStyle}
                    >
                        {activeSection === SettingsSection.general && <GeneralSection />}
                        {activeSection === SettingsSection.plan && <SubscriptionSection />}
                        {activeSection === SettingsSection.billing && <BillingSection />}
                    </div>
                </div>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

/* ── Reusable bits ─────────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-[18px] font-semibold mb-4 tracking-tight" style={{ color: TEXT }}>
            {children}
        </h3>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-[12px] font-medium mb-1.5 pl-1" style={{ color: MUTED }}>
            {children}
        </div>
    );
}

function NeuInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="rounded-full px-5 py-2.5 text-[14px] border-none outline-none w-full"
            style={{ ...insetStyle, color: TEXT, fontFamily: 'inherit' }}
        />
    );
}

function NeuPillButton({
    children,
    onClick,
    type = 'button',
    disabled,
    variant = 'default',
    className,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
    variant?: 'default' | 'destructive' | 'ghost';
    className?: string;
}) {
    const colorMap = {
        default: TEXT,
        destructive: 'oklch(0.55 0.22 27)',
        ghost: MUTED,
    };
    return (
        <WaterRipple className={`rounded-full ${className ?? ''}`}>
            <button
                type={type}
                onClick={onClick}
                disabled={disabled}
                className="rounded-full px-6 py-2.5 text-[13px] font-semibold cursor-pointer border-none disabled:opacity-50 transition-transform active:translate-y-px"
                style={{
                    ...raisedSm,
                    color: colorMap[variant],
                    fontFamily: 'inherit',
                    width: '100%',
                }}
            >
                {children}
            </button>
        </WaterRipple>
    );
}

function NeuIconBtn({
    children,
    onClick,
    'aria-label': ariaLabel,
}: {
    children: React.ReactNode;
    onClick: () => void;
    'aria-label': string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className="size-8 rounded-full flex items-center justify-center cursor-pointer transition-transform active:translate-y-px"
            style={{ ...raisedSm, color: TEXT }}
        >
            {children}
        </button>
    );
}

function NeuDivider() {
    return <div className="my-6 h-px rounded-full" style={trackStyle} />;
}

/* ── General Section ───────────────────────────────────────── */

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
        <div>
            <SectionHeading>Profile</SectionHeading>

            <div className="space-y-5">
                <div>
                    <FieldLabel>Name</FieldLabel>
                    {editingName ? (
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <NeuInput
                                    value={editFirst}
                                    onChange={(e) => setEditFirst(e.target.value)}
                                    placeholder="First"
                                />
                            </div>
                            <div className="flex-1">
                                <NeuInput
                                    value={editLast}
                                    onChange={(e) => setEditLast(e.target.value)}
                                    placeholder="Last"
                                />
                            </div>
                            <NeuIconBtn onClick={saveName} aria-label="Save">
                                <Check className="size-4" />
                            </NeuIconBtn>
                            <NeuIconBtn onClick={cancelNameEdit} aria-label="Cancel">
                                <X className="size-4" />
                            </NeuIconBtn>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 rounded-full px-5 py-2.5 text-[14px]" style={insetStyle}>
                                {firstName} {lastName}
                            </div>
                            <NeuIconBtn onClick={startNameEdit} aria-label="Edit name">
                                <Pencil className="size-3.5" />
                            </NeuIconBtn>
                        </div>
                    )}
                </div>

                <div>
                    <FieldLabel>Email</FieldLabel>
                    <div
                        className="rounded-full px-5 py-2.5 text-[14px]"
                        style={{ ...insetStyle, color: MUTED }}
                    >
                        {email || '—'}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Subscription Section ──────────────────────────────────── */

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
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
                <SectionHeading>Account deletion requested</SectionHeading>
                <p className="max-w-sm text-[14px]" style={{ color: MUTED }}>
                    Your request has been received. Your account will be deleted within 3–5 business days.
                </p>
                <div className="w-40">
                    <NeuPillButton onClick={() => setShowDeleteConfirm(false)} variant="ghost">
                        Dismiss
                    </NeuPillButton>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <SectionHeading>Plans</SectionHeading>

                {/* Billing cycle toggle — pill track */}
                <div className="flex p-1 rounded-full gap-1" style={trackStyle}>
                    {[
                        { v: false, label: 'Monthly' },
                        { v: true, label: 'Yearly' },
                    ].map(({ v, label }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => setYearly(v)}
                            className="px-4 py-1.5 rounded-full text-[12px] cursor-pointer transition-all"
                            style={
                                yearly === v
                                    ? { ...pillActive, color: TEXT, fontWeight: 600 }
                                    : { background: 'transparent', color: MUTED, fontWeight: 500 }
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <PlanCard
                    name="Pro"
                    description="30 notes from solace per day"
                    yearly={yearly}
                    monthlyPrice="$10"
                    monthlySubtext="50% off for 3 months, then $10/month"
                    yearlyPrice="$100"
                    yearlySubtext="2 months free"
                    isCurrent={plan === Plan.pro}
                />
                <PlanCard
                    name="Max"
                    description="100 notes from solace per day"
                    yearly={yearly}
                    monthlyPrice="$20"
                    yearlyPrice="$300"
                    yearlySubtext="2 months free"
                    isCurrent={plan === Plan.max}
                />
            </div>

            <NeuDivider />

            <div className="space-y-3">
                {isSubscribed && (
                    <NeuPillButton onClick={handleCancelSubscription} variant="destructive">
                        Cancel subscription
                    </NeuPillButton>
                )}

                {isSubscribed ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-block w-full">
                                <NeuPillButton disabled variant="ghost">
                                    Delete account
                                </NeuPillButton>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>You must cancel your subscription before deleting your account.</p>
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <NeuPillButton onClick={handleDeleteAccount} variant="destructive">
                        Delete account
                    </NeuPillButton>
                )}
            </div>
        </div>
    );
}

function PlanCard({
    name,
    description,
    yearly,
    monthlyPrice,
    monthlySubtext,
    yearlyPrice,
    yearlySubtext,
    isCurrent,
}: {
    name: string;
    description: string;
    yearly: boolean;
    monthlyPrice: string;
    monthlySubtext?: string;
    yearlyPrice: string;
    yearlySubtext?: string;
    isCurrent: boolean;
}) {
    const price = yearly ? yearlyPrice : monthlyPrice;
    const period = yearly ? '/year' : '/month';
    const subtext = yearly ? yearlySubtext : monthlySubtext;

    return (
        <div className="relative rounded-[22px] p-5 space-y-4" style={raisedSm}>
            {isCurrent && (
                <div
                    className="absolute -top-3 left-4 text-[10px] font-semibold px-3 py-1 rounded-full tracking-wide uppercase"
                    style={{ ...raisedSm, color: ACCENT }}
                >
                    Current Plan
                </div>
            )}

            <div>
                <h4 className="font-semibold text-[16px]" style={{ color: TEXT }}>
                    {name} Plan
                </h4>
                <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                    {description}
                </p>
            </div>

            <div>
                <div className="text-[28px] font-bold tracking-tight" style={{ color: TEXT }}>
                    {price}
                    <span className="text-[12px] font-normal ml-1" style={{ color: MUTED }}>
                        {period}
                    </span>
                </div>
                {subtext && (
                    <p className="text-[11px] font-medium mt-1" style={{ color: 'oklch(0.55 0.14 150)' }}>
                        {subtext}
                    </p>
                )}
            </div>

            {!isCurrent && <NeuPillButton>Subscribe to {name}</NeuPillButton>}
        </div>
    );
}

/* ── Billing Section ───────────────────────────────────────── */

function BillingSection() {
    const { userId } = useUserStore();
    const { data: history = [], isLoading } = useBillingHistoryQuery(userId);

    if (isLoading) {
        return (
            <div>
                <SectionHeading>Card on file</SectionHeading>
                <div className="rounded-full p-1" style={insetStyle}>
                    <Skeleton className="h-8 w-72 rounded-full" />
                </div>
                <NeuDivider />
                <SectionHeading>Payment history</SectionHeading>
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <SectionHeading>Card on file</SectionHeading>
            <div
                className="rounded-full px-5 py-2.5 text-[13px]"
                style={{ ...insetStyle, color: MUTED }}
            >
                No card on file
            </div>

            <NeuDivider />

            <SectionHeading>Payment history</SectionHeading>
            {history.length > 0 ? (
                <div className="space-y-2">
                    <div
                        className="grid grid-cols-3 text-[10px] font-semibold tracking-[0.18em] uppercase px-5 pb-1"
                        style={{ color: MUTED }}
                    >
                        <span>Date</span>
                        <span>Plan</span>
                        <span>Amount</span>
                    </div>
                    {history.map((entry) => (
                        <div
                            key={entry.billingId}
                            className="grid grid-cols-3 items-center text-[13px] px-5 py-2.5 rounded-full"
                            style={{ ...insetStyle, color: TEXT }}
                        >
                            <span>{new Date(entry.billedAt).toLocaleDateString()}</span>
                            <span>
                                {entry.planType}
                                {entry.isYearPlan ? ' · yearly' : ''}
                            </span>
                            <span className="tabular-nums">${(entry.amountCents / 100).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    className="rounded-full px-5 py-2.5 text-[13px]"
                    style={{ ...insetStyle, color: MUTED }}
                >
                    No payment history
                </div>
            )}
        </div>
    );
}
