import React from 'react';
import SectionCard from './SectionCard';
import { Button, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = {
  onDeleteAll: () => void;
  onResetApp: () => void;
};

export default function DangerZoneSection({ onDeleteAll, onResetApp }: Props) {
  const { t } = useTranslation();
  return (
    <SectionCard title={t('settings.dangerZone', 'Danger Zone')}>
      <Grid container spacing={2}>
        <Grid size={6}>
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={onDeleteAll}
          >
            {t('settings.deleteAllAccounts')}
          </Button>
        </Grid>
        <Grid size={6}>
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={onResetApp}
          >
            {t('settings.resetApp')}
          </Button>
        </Grid>
      </Grid>
    </SectionCard>
  );
}
