import React from 'react';
import SectionCard from './SectionCard';
import { FormControl, MenuItem, Select } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = {
  ip: string;
  onChange: (e: any) => void;
};

export default function ServerSection({ ip, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <SectionCard title={t('settings.server', 'Server')}>
      <FormControl fullWidth>
        <Select value={ip} onChange={onChange}>
          <MenuItem value="ar.zheneq.net:6050">{t('ips.noProxy')}</MenuItem>
          <MenuItem value="de.evos.live:6050">{t('ips.proxy1')}</MenuItem>
          <MenuItem value="fr.evos.live:6050">{t('ips.proxy2')}</MenuItem>
          <MenuItem value="fi.evos.live:6050">{t('ips.proxy3')}</MenuItem>
          <MenuItem value="ru.ar.zheneq.net:6050">{t('ips.proxy4')}</MenuItem>
          <MenuItem value="nl.ar.zheneq.net:6051">{t('ips.proxy5')}</MenuItem>
        </Select>
      </FormControl>
    </SectionCard>
  );
}
