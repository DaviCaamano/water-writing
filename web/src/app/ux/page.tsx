'use client';

import { Plus, Settings, Search, ChevronDown, Heart, Trash2 } from 'lucide-react';
import { Variant } from '~types';
import { Button } from '~components/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~components/primitives/dialog';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '~components/primitives/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '~components/primitives/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~components/primitives/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~components/primitives/select';
import { Label } from '~components/primitives/label';
import { Skeleton } from '~components/primitives/skeleton';
import { Switch } from '~components/primitives/switch';
import { Input } from '~components/primitives/input';
import { ColorSwap } from '~components/color-swap';

const INPUT_VARIANTS = [
  'default',
  'debossed',
  'bossed',
  'primary',
  'secondary',
  'destructive',
  'accent',
] as const;

const VARIANTS = [
  'default',
  'debossed',
  'bossed',
  'accented',
  'destructive',
  'primary',
  'secondary',
  'muted',
  'success',
] as const;

const SIZES = [
  'default',
  'sm',
  'lg',
  'icon',
  'icon-sm',
  'icon-lg',
  'pill',
  'pill-sm',
  'pill-lg',
] as const;

type Size = (typeof SIZES)[number];

const isIconSize = (size: Size) => size.startsWith('icon');
const isPillSize = (size: Size) => size.startsWith('pill');
const buttonLabel = (size: Size) =>
  isIconSize(size) ? null : isPillSize(size) ? 'Pill' : 'Button';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className='space-y-4'>
    <h2 className='text-xl font-semibold text-foreground'>{title}</h2>
    {children}
  </section>
);

const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card'>
    <div className='flex flex-1 items-center justify-center min-h-12'>{children}</div>
    <span className='text-[11px] text-muted-foreground font-mono'>{label}</span>
  </div>
);

export default function UxPage() {
  return (
    <div className='bg-background min-h-screen p-8 space-y-12'>
      <ColorSwap />
      <header className='space-y-2'>
        <h1 className='text-3xl font-bold text-foreground'>UX Primitives</h1>
        <p className='text-sm text-muted-foreground'>
          Visual reference for every primitive component and its variants.
        </p>
      </header>

      <Section title='Button — variants'>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
          {VARIANTS.map((variant) => (
            <Cell key={variant} label={variant}>
              <Button variant={variant}>{variant}</Button>
            </Cell>
          ))}
        </div>
      </Section>

      <Section title='Button — sizes (variant × size matrix)'>
        <div className='rounded-lg border border-border bg-card p-4 overflow-x-auto'>
          <table className='w-full text-sm border-collapse'>
            <thead>
              <tr>
                <th className='text-left p-2 text-muted-foreground font-medium'>variant</th>
                {SIZES.map((size) => (
                  <th
                    key={size}
                    className='p-2 text-muted-foreground font-mono text-[11px] font-normal text-center'
                  >
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VARIANTS.map((variant) => (
                <tr key={variant} className='border-t border-border'>
                  <td className='p-2 pr-4 text-foreground font-mono text-xs whitespace-nowrap'>
                    {variant}
                  </td>
                  {SIZES.map((size) => (
                    <td key={size} className='p-2 text-center'>
                      <div className='flex items-center justify-center'>
                        <Button variant={variant} size={size}>
                          {buttonLabel(size) ?? <Plus />}
                        </Button>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title='Switch'>
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
          <Cell label='off'>
            <Switch offLabel='Off' onLabel='On' />
          </Cell>
          <Cell label='on'>
            <Switch offLabel='Off' onLabel='On' defaultChecked />
          </Cell>
          <Cell label='disabled off'>
            <Switch offLabel='Off' onLabel='On' disabled />
          </Cell>
          <Cell label='disabled on'>
            <Switch offLabel='Off' onLabel='On' disabled defaultChecked />
          </Cell>
          <Cell label='custom labels'>
            <Switch offLabel='Monthly' onLabel='Yearly' />
          </Cell>
        </div>
      </Section>

      <Section title='Dialog'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <Cell label='Dialog'>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='primary'>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Example dialog</DialogTitle>
                  <DialogDescription>
                    A modal dialog wrapping Radix primitives. Click outside or the X to close.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter showCloseButton />
              </DialogContent>
            </Dialog>
          </Cell>
        </div>
      </Section>

      <Section title='Popover'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <Cell label='Popover'>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='secondary'>Open popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Popover title</PopoverTitle>
                  <PopoverDescription>
                    Floating content anchored to a trigger element.
                  </PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          </Cell>
        </div>
      </Section>

      <Section title='Tooltip'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <Cell label='Tooltip (hover the heart)'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='muted' size='icon'>
                  <Heart />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Hover-hint text</TooltipContent>
            </Tooltip>
          </Cell>
        </div>
      </Section>

      <Section title='Dropdown Menu'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <Cell label='DropdownMenu'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='secondary'>
                  Actions
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Search />
                  Search
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant={Variant.destructive}>
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Cell>
        </div>
      </Section>

      <Section title='Select'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <Cell label='primary'>
            <Select>
              <SelectTrigger variant='primary' className='w-48'>
                <SelectValue placeholder='Pick an option' />
              </SelectTrigger>
              <SelectContent variant='primary'>
                <SelectItem value='alpha'>Alpha</SelectItem>
                <SelectItem value='beta'>Beta</SelectItem>
                <SelectItem value='gamma'>Gamma</SelectItem>
              </SelectContent>
            </Select>
          </Cell>
        </div>
      </Section>

      <Section title='Label'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <Cell label='Label'>
            <Label htmlFor='ux-label-example'>Field label</Label>
          </Cell>
        </div>
      </Section>

      <Section title='Input — variants'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {INPUT_VARIANTS.map((variant) => (
            <Cell key={variant} label={variant}>
              <Input variant={variant} placeholder={variant} className='w-44' />
            </Cell>
          ))}
        </div>
      </Section>

      <Section title='Input — sizes'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {(['default', 'sm', 'lg', 'pill', 'pill-sm', 'pill-lg'] as const).map((size) => (
            <Cell key={size} label={size}>
              <Input size={size} placeholder={size} className='w-44' />
            </Cell>
          ))}
        </div>
      </Section>

      <Section title='Skeleton — typical loading shapes'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          <Cell label='single text line'>
            <Skeleton className='h-4 w-40' />
          </Cell>
          <Cell label='paragraph (3 lines)'>
            <div className='flex flex-col gap-2 w-40'>
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-11/12' />
              <Skeleton className='h-3 w-3/4' />
            </div>
          </Cell>
          <Cell label='avatar (circle)'>
            <Skeleton className='size-12 rounded-full' />
          </Cell>
          <Cell label='image block'>
            <Skeleton className='h-20 w-32 rounded-lg' />
          </Cell>
        </div>
      </Section>
    </div>
  );
}
