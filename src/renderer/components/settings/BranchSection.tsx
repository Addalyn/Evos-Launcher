import React from 'react';
import SectionCard from './SectionCard';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Grid,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import { isValidExePath } from 'renderer/lib/Error';
import { Branches } from 'renderer/lib/Evos';

type Props = {
  exePath: string;
  locked: boolean;
  branch: string;
  isDev: boolean;
  branchesData: Branches;
  selectedArguments: Record<string, string | null>;
  onChangeBranch: (e: any) => void;
  onRefresh: () => void;
  onArgumentChange: (key: string, value: string) => void;
};

export default function BranchSection({
  exePath,
  locked,
  branch,
  isDev,
  branchesData,
  selectedArguments,
  onChangeBranch,
  onRefresh,
  onArgumentChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <SectionCard title={t('settings.branch', 'Branch')}>
      {!branchesData && isValidExePath(exePath) && (
        <Skeleton variant="rectangular" width="100%" height={350} />
      )}
      {branchesData && isValidExePath(exePath) && (
        <>
          <Typography variant="caption">
            {t('settings.selectBranchHelper')}
          </Typography>
          <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Grid item xs={8}>
              <TextField
                id="branch-select"
                select
                label={t('settings.selectBranch')}
                value={branch}
                onChange={onChangeBranch}
                variant="outlined"
                disabled={locked}
                fullWidth
              >
                {Object.keys(branchesData).map((key) => {
                  const branchInfo = branchesData[key];
                  if (
                    branchInfo &&
                    (branchInfo.enabled || (isDev && branchInfo.devOnly))
                  ) {
                    return (
                      <MenuItem
                        key={key}
                        value={key}
                        disabled={branchInfo.disabled}
                      >
                        {key}
                        {branchInfo.version !== ''
                          ? ` (${branchInfo.version})`
                          : ''}
                        {branchInfo.recommended
                          ? ` (${t('settings.recommended')})`
                          : ''}
                        {branchInfo.removed
                          ? ` (${t('settings.removed')})`
                          : ''}
                        {isDev && branchInfo.devOnly ? ' (dev branch)' : ''}
                      </MenuItem>
                    );
                  }
                  return null;
                })}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <Button
                onClick={onRefresh}
                variant="contained"
                color="primary"
                disabled={locked}
                fullWidth
              >
                {t('settings.refreshBranch')}
              </Button>
            </Grid>
            <Grid item xs={12}>
              {branch &&
                branchesData &&
                branchesData[branch]?.arguments &&
                Array.isArray(branchesData[branch]?.arguments) &&
                (branchesData[branch]?.arguments?.length ?? 0) > 0 &&
                branchesData[branch]?.text}
            </Grid>
            <Grid item xs={12}>
              {branch &&
                branchesData &&
                branchesData[branch]?.arguments &&
                Array.isArray(branchesData[branch]?.arguments) &&
                (branchesData[branch]?.arguments?.length ?? 0) > 0 && (
                  <div>
                    {(branchesData[branch]?.arguments?.some(
                      (arg) => !arg.showOnlyDev,
                    ) ||
                      isDev) && (
                      <>
                        <span
                          style={{
                            fontSize: '0.8em',
                            marginBottom: '0.5em',
                            display: 'block',
                          }}
                        >
                          {t('settings.arguments')}:
                        </span>
                        {branchesData[branch]?.arguments?.map((arg) => {
                          if (arg.showOnlyDev && !isDev) return null;
                          return (
                            <TextField
                              key={arg.key}
                              select
                              label={`${arg.key}`}
                              value={
                                selectedArguments[arg.key] ??
                                arg.defaultValue ??
                                ''
                              }
                              onChange={(e) =>
                                onArgumentChange(
                                  arg.key,
                                  e.target.value as string,
                                )
                              }
                              helperText={`${arg.description}`}
                              fullWidth
                              margin="normal"
                            >
                              {arg.value.map((value) => (
                                <MenuItem key={value} value={value}>
                                  {value}
                                </MenuItem>
                              ))}
                            </TextField>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
            </Grid>
            <Grid item xs={12}>
              {branch && branchesData && branchesData[branch]?.files && (
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="files-content"
                    id="files-header"
                  >
                    <Typography>{t('Downloaded')}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <ul>
                      {branchesData[branch]?.files.map((file) => (
                        <li key={file.path}>
                          {file.path}: {file.checksum}
                        </li>
                      ))}
                    </ul>
                  </AccordionDetails>
                </Accordion>
              )}
            </Grid>
          </Grid>
        </>
      )}
    </SectionCard>
  );
}
