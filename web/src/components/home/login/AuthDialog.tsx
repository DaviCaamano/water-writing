'use client';

import { useReducer } from 'react';
import { Dialog, DialogContent, DialogTitle } from '~components/primitives/dialog';
import { Button } from '~components/primitives/button';
import { Input } from '~components/primitives/input';
import { Switch } from '~components/primitives/switch';
import { WaterRipple } from '~components/visual-effects/WaterRipple';
import { useUserStore } from '~store/useUserStore';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const neuCard: React.CSSProperties = {
  background: 'var(--neu-bg)',
  boxShadow: '12px 12px 28px var(--neu-shadow), -12px -12px 28px var(--neu-highlight)',
};

const textColor = 'var(--neu-text)';
const mutedColor = 'var(--neu-text-muted)';

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
  | {
      type: 'SET_FIELD';
      field: 'email' | 'password' | 'confirm' | 'firstName' | 'lastName';
      value: string;
    }
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

const authFormReducer = (state: AuthFormState, action: AuthFormAction): AuthFormState => {
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
};

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
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
        error:
          err instanceof Error ? err.message : mode === 'login' ? 'Login failed' : 'Signup failed',
      });
    } finally {
      dispatch({ type: 'SUBMIT_END' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent bare showCloseButton={false} aria-describedby={undefined}>
        <VisuallyHidden.Root>
          <DialogTitle>{mode === 'login' ? 'Log In' : 'Create Account'}</DialogTitle>
        </VisuallyHidden.Root>
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
            <Switch
              offLabel='Log In'
              onLabel='Sign Up'
              checked={mode === 'signup'}
              onCheckedChange={(v) => dispatch({ type: 'SET_MODE', mode: v ? 'signup' : 'login' })}
              className='w-full'
            />

            {/* Error */}
            {error && (
              <div className='text-destructive-foreground text-sm text-center -my-2'>{error}</div>
            )}

            {/* Fields */}
            <form onSubmit={handleSubmit} className='flex flex-col gap-4.5'>
              {mode === 'signup' && (
                <div className='grid grid-cols-2 gap-3'>
                  <div className='flex flex-col gap-2'>
                    <label className='text-[15px] font-semibold pl-1' style={{ color: textColor }}>
                      First name
                    </label>
                    <Input
                      size='pill-lg'
                      value={firstName}
                      onChange={(e) =>
                        dispatch({ type: 'SET_FIELD', field: 'firstName', value: e.target.value })
                      }
                      placeholder='Jane'
                      required
                    />
                  </div>
                  <div className='flex flex-col gap-2'>
                    <label className='text-[15px] font-semibold pl-1' style={{ color: textColor }}>
                      Last name
                    </label>
                    <Input
                      size='pill-lg'
                      value={lastName}
                      onChange={(e) =>
                        dispatch({ type: 'SET_FIELD', field: 'lastName', value: e.target.value })
                      }
                      placeholder='Doe'
                      required
                    />
                  </div>
                </div>
              )}

              <div className='flex flex-col gap-2'>
                <label className='text-[15px] font-semibold pl-1' style={{ color: textColor }}>
                  Email
                </label>
                <Input
                  type='email'
                  size='pill-lg'
                  value={email}
                  onChange={(e) =>
                    dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })
                  }
                  placeholder='you@example.com'
                  autoComplete='email'
                  required
                />
              </div>

              <div className='flex flex-col gap-2'>
                <label className='text-[15px] font-semibold pl-1' style={{ color: textColor }}>
                  Password
                </label>
                <Input
                  type='password'
                  size='pill-lg'
                  value={password}
                  onChange={(e) =>
                    dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })
                  }
                  placeholder='••••••••••'
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
              </div>

              {mode === 'signup' && (
                <div className='flex flex-col gap-2'>
                  <label className='text-[15px] font-semibold pl-1' style={{ color: textColor }}>
                    Confirm password
                  </label>
                  <Input
                    type='password'
                    size='pill-lg'
                    value={confirm}
                    onChange={(e) =>
                      dispatch({ type: 'SET_FIELD', field: 'confirm', value: e.target.value })
                    }
                    placeholder='••••••••••'
                    autoComplete='new-password'
                    required
                  />
                </div>
              )}

              {/* Submit button */}
              <div className='flex justify-center mt-1'>
                <WaterRipple className='rounded-full'>
                  <Button
                    type='submit'
                    variant='default'
                    size='pill-lg'
                    disabled={loading}
                    className='px-12'
                  >
                    {loading
                      ? mode === 'login'
                        ? 'Logging in…'
                        : 'Creating account…'
                      : mode === 'login'
                        ? 'Log In'
                        : 'Create Account'}
                  </Button>
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
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--neu-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--neu-text-muted)')}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
};
