import { PopoverContent } from '~components/primitives/popover';
import { Label } from '~components/primitives/label';
import { Button } from '~components/primitives/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~components/primitives/select';
import { useEditorStore } from '~store/useEditorStore';
import { useTheme } from '~providers/theme';
import type { EditorTheme } from '~types/story';
import { Variant } from '~types';
import { WaterRippleFade } from '~components/visual-effects/WaterRippleFade';
import { cn } from '~utils/merge-css-classes';

const FONT_OPTIONS = [
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'System Sans', value: 'var(--font-sans), sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];

const THEME_OPTIONS: { label: string; value: EditorTheme }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Sepia', value: 'sepia' },
];

const FONT_SIZES = [14, 16, 18, 20, 22, 24];

export const EditorSettingsContent = ({ open }: { open: boolean }) => {
  const { fontSize, fontFamily, setFontSize, setFontFamily } = useEditorStore();
  const { theme, setTheme } = useTheme();

  return (
    <PopoverContent
      forceMount
      side='top'
      align='start'
      className={cn(
        '-editor-settings-content-',
        'w-64 bg-transparent! ring-0! border-none! p-0! shadow-none!',
        'data-[state=open]:animate-none data-[state=closed]:animate-none',
      )}
    >
      <WaterRippleFade
        open={open}
        maxScale={40}
        className={cn(
          'space-y-4',
          'embossed rounded-lg',
          'py-4 px-6 border border-border',
          'text-sm text-primary',
        )}
      >
        <div className='space-y-2'>
          <Label className='text-xs font-medium'>Font Size</Label>
          <div className='flex gap-1 flex-wrap'>
            {FONT_SIZES.map((size) => (
              <Button
                key={size}
                variant={fontSize === size ? Variant.default : Variant.muted}
                size='sm'
                className='w-10 h-8 text-xs shadow-shadow shadow'
                onClick={() => setFontSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <Label className='text-xs font-medium'>Font</Label>
          <Select value={fontFamily} onValueChange={(v) => v && setFontFamily(v)}>
            <SelectTrigger variant={Variant.primary} className='h-8 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent variant={Variant.primary}>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label className='text-xs font-medium'>Theme</Label>
          <div className='flex gap-1'>
            {THEME_OPTIONS.map((themeOption) => (
              <Button
                key={themeOption.value}
                variant={theme === themeOption.value ? Variant.default : Variant.muted}
                size='sm'
                className='flex-1 h-8 text-xs shadow-shadow shadow'
                onClick={() => setTheme(themeOption.value)}
              >
                {themeOption.label}
              </Button>
            ))}
          </div>
        </div>
      </WaterRippleFade>
    </PopoverContent>
  );
};
