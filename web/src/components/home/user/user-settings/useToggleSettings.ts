import { useState } from 'react';
import { SettingsSection } from '~types/components/settings-modal';

export const useToggleSettings = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(SettingsSection.general);

  const handleOpenSettings = (section: SettingsSection = SettingsSection.general) => {
    setSettingsSection(section);
    setSettingsOpen(true);
  };

  return { handleOpenSettings, settingsOpen, setSettingsOpen, settingsSection };
};
