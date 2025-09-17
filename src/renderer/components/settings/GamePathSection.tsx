import React from 'react';
import SectionCard from './SectionCard';
import {
  Alert,
  Avatar,
  Button,
  Grid,
  InputAdornment,
  TextField,
} from '@mui/material';
import { logoSmall } from 'renderer/lib/Resources';
import { useTranslation } from 'react-i18next';
import { isValidExePath, isWarningPath } from 'renderer/lib/Error';
import truncateDynamicPath from 'renderer/utils/pathUtils';

type Props = {
  exePath: string;
  searchMessage: { type: 'success' | 'error' | null; text: string };
  onSelect: () => void;
  onSearch: () => void;
};

export default function GamePathSection({
  exePath,
  searchMessage,
  onSelect,
  onSearch,
}: Props) {
  const { t } = useTranslation();
  return (
    <SectionCard title={t('settings.gamePath', 'Game Path')}>
      {searchMessage.type && (
        <Alert severity={searchMessage.type} sx={{ mb: 2 }}>
          {searchMessage.text}
        </Alert>
      )}
      {!isValidExePath(exePath) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('errors.invalidPath')}
        </Alert>
      )}
      {isWarningPath(exePath) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('warning')}
        </Alert>
      )}
      <TextField
        label={t('settings.atlasPath')}
        fullWidth
        sx={{ mb: 2 }}
        disabled
        value={truncateDynamicPath(exePath, 45)}
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
      />
      <Grid container spacing={2}>
        <Grid size={6}>
          <Button variant="contained" fullWidth onClick={onSelect}>
            {t('settings.selectAtllasExe')}
          </Button>
        </Grid>
        <Grid size={6}>
          <Button variant="contained" fullWidth onClick={onSearch}>
            {t('search')}
          </Button>
        </Grid>
      </Grid>
    </SectionCard>
  );
}
