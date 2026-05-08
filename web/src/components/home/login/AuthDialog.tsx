'use client';

import { useReducer } from 'react';
import { Dialog, DialogPortal, DialogOverlay } from '~components/ui/dialog';
import { WaterRipple } from '~components/visual-effects/WaterRipple';
import { useUserStore } from '~store/useUserStore';
import * as DialogPrimitive from '@radix-ui/react-dialog';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NEU_BG = 'oklch(0.965 0.014 237)';
const neuCard: React.CSSProperties = {
  background: NEU_BG,
  boxShadow: '12px 12px 28px rgba(148,165,190,0.55), -12px -12px 28px rgba(255,255,255,0.88)',
};
const neuInputStyle: React.CSSProperties = {
  background: NEU_BG,
  boxShadow:
    'inset 5px 5px 11px rgba(148,165,190,0.55), inset -5px -5px 11px rgba(255,255,255,0.88)',
};
const neuBtnStyle: React.CSSProperties = {
  background: NEU_BG,
  boxShadow: '6px 6px 14px rgba(148,165,190,0.55), -6px -6px 14px rgba(255,255,255,0.88)',
};
const neuTrackStyle: React.CSSProperties = {
  background: NEU_BG,
  boxShadow: 'inset 4px 4px 9px rgba(148,165,190,0.55), inset -4px -4px 9px rgba(255,255,255,0.88)',
};
const neuTabActiveStyle: React.CSSProperties = {
  background: NEU_BG,
  boxShadow: '4px 4px 10px rgba(148,165,190,0.55), -4px -4px 10px rgba(255,255,255,0.88)',
};

const textColor = 'oklch(0.32 0.01 240)';
const mutedColor = 'oklch(0.58 0.01 240)';

type AuthMode = 'login' | 'signup';

interface AuthFormState {
  mode: AuthMode;
  email: string;
  password: string;
  confirm: string;
  firstName: string;
  lastName: string;
  error: string;
  loading: boolean;
}

type AuthFormAction =
  | { type: 'SET_MODE'; mode: AuthMode }
  | { type: 'SET_FIELD'; field: 'email' | 'password' | 'confirm' | 'firstName' | 'lastName'; value: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' }
  | { type: 'RESET_FORM' };

const initialState: AuthFormState = {
  mode: 'login',
  email: '',
  password: '',
  confirm: '',
  firstName: '',
  lastName: '',
  error: '',
  loading: false,
};

function authFormReducer(state: AuthFormState, action: AuthFormAction): AuthFormState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode, error: '' };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'SUBMIT_START':
      return { ...state, error: '', loading: true };
    case 'SUBMIT_END':
      return { ...state, loading: false };
    case 'RESET_FORM':
      return { ...initialState, mode: state.mode };
    default:
      return state;
  }
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [state, dispatch] = useReducer(authFormReducer, initialState);
  const { mode, email, password, confirm, firstName, lastName, error, loading } = state;

  const { login, signup } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup' && password !== confirm) {
      dispatch({ type: 'SET_ERROR', error: 'Passwords do not match' });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup({ email, password, firstName, lastName });
      }
      dispatch({ type: 'RESET_FORM' });
      onOpenChange(false);
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err.message : mode === 'login' ? 'Login failed' : 'Signup failed',
      });
    } finally {
      dispatch({ type: 'SUBMIT_END' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className='fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
        >
          <div className='w-85 rounded-[32px] px-9 py-11 flex flex-col gap-6' style={neuCard}>
            {/* Wordmark */}
            <div className='text-center -mb-2'>
              <div className='text-[28px] font-bold tracking-tight' style={{ color: textColor }}>
                Water Writing
              </div>
              <div className='text-[11px] mt-0.5 tracking-[0.04em]' style={{ color: mutedColor }}>
                Your Story, in Full Flow
              </div>
            </div>

            {/* Tab toggle */}
            <div className='flex rounded-full p-1 gap-1' style={neuTrackStyle}>
              {(['login', 'signup'] as const).map((tab) => (
                <button
                  key={tab}
                  type='button'
                  className='flex-1 rounded-full py-2 text-[13px] font-medium transition-all duration-200 cursor-pointer'
                  style={
                    mode === tab
                      ? { ...neuTabActiveStyle, color: textColor, fontWeight: 600 }
                      : { background: 'transparent', color: mutedColor }
                  }
                  onClick={() => dispatch({ type: 'SET_MODE', mode: tab })}
                >
                  {tab === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && <div className='text-black text-sm text-center -my-2'>{error}</div>}

            {/* Fields */}
            <form onSubmit={handleSubmit} className='flex flex-col gap-4.5'>
              {mode === 'signup' && (
                <div className='grid grid-cols-2 gap-3'>
                  <div className='flex flex-col gap-2'>
                    <label className='text-[15px] font-semibold pl-1' style={{ color: textColor }}>
                      First name
                    </label>
                    <input
                      type='text'
                      value={firstName}
                      onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'firstName', value: e.target.value })}
                      placeholder='Jane'
                      required
                      className='rounded-full px-5 py-3.5 text-[15px] border-none outline-none w-full'
                      style={{ ...neuInputStyle, color: textColor, fontFamily: 'inherit' }}
                    />
                  </div>
                  <div className='flex flex-col gap-2'>
                    <label className='text-[15px] font-semibold pl-1' style={{ color: textColor }}>
                      Last name
                    </label>
                    <input
                      type='text'
                      value={lastName}
                      onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'lastName', value: e.target.value })}
                      placeholder='Doe'
                      required
                      className='rounded-full px-5 py-3.5 text-[15px] border-none outline-none w-full'
                      style={{ ...neuInputStyle, color: textColor, fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              )}

              <div className='flex flex-col gap-2'>
                <label className='text-[15px] font-semibold pl-1' style={{ color: textColor }}>
                  Email
                </label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
                  placeholder='you@example.com'
                  autoComplete='email'
                  required
                  className='rounded-full px-[22px] py-3.5 text-[15px] border-none outline-none w-full'
                  style={{ ...neuInputStyle, color: textColor, fontFamily: 'inherit' }}
                />
              </div>

              <div className='flex flex-col gap-2'>
                <label className='text-[15px] font-semibold pl-1' style={{ color: textColor }}>
                  Password
                </label>
                <input
                  type='password'
                  value={password}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
                  placeholder='••••••••••'
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  className='rounded-full px-[22px] py-3.5 text-[15px] border-none outline-none w-full'
                  style={{ ...neuInputStyle, color: textColor, fontFamily: 'inherit' }}
                />
              </div>

              {mode === 'signup' && (
                <div className='flex flex-col gap-2'>
                  <label className='text-[15px] font-semibold pl-1' style={{ color: textColor }}>
                    Confirm password
                  </label>
                  <input
                    type='password'
                    value={confirm}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'confirm', value: e.target.value })}
                    placeholder='••••••••••'
                    autoComplete='new-password'
                    required
                    className='rounded-full px-[22px] py-3.5 text-[15px] border-none outline-none w-full'
                    style={{ ...neuInputStyle, color: textColor, fontFamily: 'inherit' }}
                  />
                </div>
              )}

              {/* Submit button */}
              <div className='flex justify-center mt-1'>
                <WaterRipple className='rounded-full'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='rounded-full px-12 py-3.5 text-[16px] font-semibold tracking-[-0.01em] cursor-pointer border-none disabled:opacity-60'
                    style={{ ...neuBtnStyle, color: textColor, fontFamily: 'inherit' }}
                  >
                    {loading
                      ? mode === 'login'
                        ? 'Logging in…'
                        : 'Creating account…'
                      : mode === 'login'
                        ? 'Log In'
                        : 'Create Account'}
                  </button>
                </WaterRipple>
              </div>
            </form>

            {/* Forgot password */}
            {mode === 'login' && (
              <div className='flex justify-end -mt-2'>
                <button
                  type='button'
                  className='text-[13px] cursor-pointer bg-transparent border-none transition-colors duration-150'
                  style={{ color: mutedColor }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'oklch(0.45 0.06 240)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = mutedColor)}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
