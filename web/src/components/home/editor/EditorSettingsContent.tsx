import { PopoverContent } from '~components/ui/popover';
import { Label } from '~components/ui/label';
import { Button } from '~components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~components/ui/select';
import { useEditorStore } from '~store/useEditorStore';
import { useTheme } from 'next-themes';
import type { EditorTheme } from '~types/story';
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
                                variant={fontSize === size ? 'default' : 'outline'}
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
                        <SelectTrigger
                            className={cn(
                                'h-8 text-xs',
                                'bg-primary text-primary-foreground hover:bg-primary/90',
                                'shadow-shadow shadow',
                            )}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='bg-primary text-primary-foreground'>
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
                                variant={theme === themeOption.value ? 'default' : 'outline'}
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
