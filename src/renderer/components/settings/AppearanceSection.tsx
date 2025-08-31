import React from 'react';
import { Box, FormControlLabel, FormGroup, Grid, Switch } from '@mui/material';
import { MuiColorInput } from 'mui-color-input';
import SectionCard from './SectionCard';
import { useTranslation } from 'react-i18next';

type Props = {
  mode: string;
  toggleMode: () => void;
  colorPrimary: string;
  setColorPrimary: (v: string) => void;
  colorSecondary: string;
  setColorSecondary: (v: string) => void;
  colorBackground: string;
  setColorBackground: (v: string) => void;
  colorText: string;
  setColorText: (v: string) => void;
  colorScrollBar: string;
  setColorScrollBar: (v: string) => void;
  colorPaper: string;
  setColorPaper: (v: string) => void;
};

export default function AppearanceSection(props: Props) {
  const { t } = useTranslation();
  const {
    mode,
    toggleMode,
    colorPrimary,
    setColorPrimary,
    colorSecondary,
    setColorSecondary,
    colorBackground,
    setColorBackground,
    colorText,
    setColorText,
    colorScrollBar,
    setColorScrollBar,
    colorPaper,
    setColorPaper,
  } = props;

  return (
    <SectionCard title={t('settings.appearance', 'Appearance')}>
      <FormGroup>
        <FormControlLabel
          control={<Switch />}
          label={t('settings.labelDarkMode')}
          checked={mode === 'dark'}
          onChange={toggleMode}
        />
      </FormGroup>
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <MuiColorInput
              label={t('settings.labelPrimaryColor')}
              value={colorPrimary}
              onChange={setColorPrimary}
              fallbackValue="#9cb8ba"
              format="hex"
            />
          </Grid>
          <Grid item xs={6}>
            <MuiColorInput
              label={t('settings.labelSecondaryColor')}
              value={colorSecondary}
              onChange={setColorSecondary}
              fallbackValue="#000000"
              format="hex"
            />
          </Grid>
          <Grid item xs={6}>
            <MuiColorInput
              label={t('settings.labelBackgroundColor')}
              value={colorBackground}
              onChange={setColorBackground}
              fallbackValue="#000000fc"
              format="hex8"
            />
          </Grid>
          <Grid item xs={6}>
            <MuiColorInput
              label={t('settings.labelTextColor')}
              value={colorText}
              onChange={setColorText}
              fallbackValue="#fffffffc"
              format="hex8"
            />
          </Grid>
          <Grid item xs={6}>
            <MuiColorInput
              label={t('settings.labelPaperColor')}
              value={colorPaper}
              onChange={setColorPaper}
              fallbackValue="#ffffff"
              format="hex"
            />
          </Grid>
          <Grid item xs={6}>
            <MuiColorInput
              label={t('settings.labelScrollbarColor')}
              value={colorScrollBar}
              onChange={setColorScrollBar}
              fallbackValue="#ffffff"
              format="hex"
            />
          </Grid>
        </Grid>
      </Box>
    </SectionCard>
  );
}
