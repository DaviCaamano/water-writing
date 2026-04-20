'use client';

import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEditorStore } from '@/store/useEditorStore';
import type { EditorTheme } from '@/types';

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

export function FontSettings() {
  const { fontSize, fontFamily, theme, setFontSize, setFontFamily, setTheme } = useEditorStore();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="p-2 rounded-full hover:bg-accent/80 transition-colors"
        aria-label="Text settings"
      >
        <ScrollText className="w-5 h-5" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-64 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Font Size</Label>
          <div className="flex gap-1 flex-wrap">
            {FONT_SIZES.map((size) => (
              <Button
                key={size}
                variant={fontSize === size ? 'default' : 'outline'}
                size="sm"
                className="w-10 h-8 text-xs"
                onClick={() => setFontSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Font</Label>
          <Select value={fontFamily} onValueChange={(v) => v && setFontFamily(v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Theme</Label>
          <div className="flex gap-1">
            {THEME_OPTIONS.map((t) => (
              <Button
                key={t.value}
                variant={theme === t.value ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setTheme(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
