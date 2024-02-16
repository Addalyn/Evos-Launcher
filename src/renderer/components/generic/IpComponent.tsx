import React, { useState } from 'react'; // Import useState
import {
  Box,
  Button,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import EvosStore from 'renderer/lib/EvosStore';
import { useTranslation } from 'react-i18next';

function IpComponent() {
  const { setIp } = EvosStore();
  const [selectedIp, setSelectedIp] = useState('evos-emu.com'); // Initialize the state
  const { t } = useTranslation();

  const onSubmit = () => {
    setIp(selectedIp); // Use the selectedIp state
  };

  const handleSelectChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSelectedIp(event.target.value); // Update the selectedIp state
  };

  return (
    <>
      <Typography component="h1" variant="h5">
        {t('selectIp')}
      </Typography>
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
        <FormControl fullWidth>
          <Select value={selectedIp} onChange={handleSelectChange}>
            {' '}
            {/* Set value and onChange */}
            <MenuItem value="evos-emu.com">{t('ips.noProxy')}</MenuItem>
            <MenuItem value="de.evos.live">{t('ips.proxy1')}</MenuItem>
            <MenuItem value="fr.evos.live">{t('ips.proxy2')}</MenuItem>
            <MenuItem value="fi.evos.live">{t('ips.proxy3')}</MenuItem>
          </Select>
        </FormControl>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            mt: 3,
            mb: 2,
            backgroundColor: (theme) => theme.palette.primary.light,
          }}
        >
          {t('submit')}
        </Button>
      </Box>
    </>
  );
}

export default IpComponent;
