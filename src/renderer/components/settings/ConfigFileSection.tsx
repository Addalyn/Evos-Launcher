import React from 'react';
import SectionCard from './SectionCard';
import { Avatar, Button, InputAdornment, TextField } from '@mui/material';
import { logoSmall } from 'renderer/lib/Resources';
import truncateDynamicPath from 'renderer/utils/pathUtils';
import { useTranslation } from 'react-i18next';

type Props = {
  activeHandle: string | undefined;
  configFile: string | undefined;
  onSelect: () => void;
  hidden: boolean;
};

export default function ConfigFileSection({
  activeHandle,
  configFile,
  onSelect,
  hidden,
}: Props) {
  const { t } = useTranslation();
  return (
    <SectionCard
      title={t('settings.configFile', 'Config File')}
      hidden={hidden}
    >
      <TextField
        placeholder={`${t('settings.configFilePlaceHolder')} ${activeHandle}`}
        value={truncateDynamicPath(
          configFile === undefined ? '' : configFile,
          45,
        )}
        variant="outlined"
        disabled
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Avatar
                alt="logo"
                variant="square"
                src={logoSmall()}
                sx={{ width: 40, height: 40 }}
              />
            </InputAdornment>
          ),
        }}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={onSelect} fullWidth>
        {t('settings.selectConfigFile')}
      </Button>
    </SectionCard>
  );
}
