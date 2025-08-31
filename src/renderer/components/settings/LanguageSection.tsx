import React from 'react';
import { Box, MenuItem, Select } from '@mui/material';
import Flag from 'react-flagkit';
import SectionCard from './SectionCard';
import { useTranslation } from 'react-i18next';

type Lngs = { [key: string]: { nativeName: string; icon: string } };

type Props = {
  lngs: Lngs;
};

export default function LanguageSection({ lngs }: Props) {
  const { t, i18n } = useTranslation();
  return (
    <SectionCard title={t('settings.language', 'Language')}>
      <Select
        fullWidth
        value={i18n.language ? i18n.language : lngs.en.nativeName}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        {Object.keys(lngs).map((lng) => (
          <MenuItem value={lng} key={lng}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Flag country={lngs[lng].icon} size={20} />
              <span style={{ marginLeft: 8 }}>{lngs[lng].nativeName}</span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </SectionCard>
  );
}
