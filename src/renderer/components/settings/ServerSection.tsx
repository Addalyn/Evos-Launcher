import React, { useEffect, useState } from 'react';
import SectionCard from './SectionCard';
import { FormControl, MenuItem, Select } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getProxys, type Proxy } from 'renderer/lib/Evos';

type Props = {
  ip: string;
  onChange: (e: any) => void;
};

export default function ServerSection({ ip, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const [proxies, setProxies] = useState<Proxy[]>([]);

  useEffect(() => {
    getProxys()
      .then((response) => {
        setProxies(response.data);
        return response.data;
      })
      .catch(() => {
        // silently ignore fetch errors
      });
  }, []);

  return (
    <SectionCard title={t('settings.server', 'Server')}>
      <FormControl fullWidth>
        <Select value={ip} onChange={onChange}>
          {proxies.map((proxy) => (
            <MenuItem key={proxy.ip} value={proxy.ip}>
              {proxy[i18n.language] || proxy.en || proxy.name || proxy.ip}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </SectionCard>
  );
}
