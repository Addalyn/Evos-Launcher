import React from 'react';
import SectionCard from './SectionCard';
import { Button, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = {
  password: string;
  password1: string;
  error: string;
  setPassword: (v: string) => void;
  setPassword1: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function AccountSection({
  password,
  password1,
  error,
  setPassword,
  setPassword1,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  return (
    <SectionCard title={t('settings.account', 'Account')}>
      <form onSubmit={onSubmit}>
        <TextField
          label={t('changePassword')}
          type="password"
          fullWidth
          sx={{ mb: 2 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('enterNewPass')}
        />
        <TextField
          label={t('confirmPassword')}
          type="password"
          fullWidth
          sx={{ mb: 2 }}
          value={password1}
          onChange={(e) => setPassword1(e.target.value)}
          placeholder={t('enterNewPass')}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          {t('submit')}
        </Button>
        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </form>
    </SectionCard>
  );
}
