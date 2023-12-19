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

function IpComponent() {
  const { setIp } = EvosStore();
  const [selectedIp, setSelectedIp] = useState('evos-emu.com'); // Initialize the state

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
        Select the IP you wish to connect to
      </Typography>
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
        <FormControl fullWidth>
          <Select value={selectedIp} onChange={handleSelectChange}>
            {' '}
            {/* Set value and onChange */}
            <MenuItem value="evos-emu.com">evos-emu.com (No Proxy)</MenuItem>
            <MenuItem value="arproxy.addalyn.baby">
              evos-emu.com (Proxy in Germany)
            </MenuItem>
            <MenuItem value="arproxy2.addalyn.baby">
              evos-emu.com (Proxy in France)
            </MenuItem>
            <MenuItem value="arproxy3.addalyn.baby">
              evos-emu.com (Proxy in Finland)
            </MenuItem>
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
          Submit
        </Button>
      </Box>
    </>
  );
}

export default IpComponent;
