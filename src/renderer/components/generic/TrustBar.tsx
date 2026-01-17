import {
  Box,
  LinearProgress,
  Paper,
  Typography,
  linearProgressClasses,
  styled,
} from '@mui/material';

/**
 * Styled LinearProgress component with custom styling for trust bars
 */
const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 20,
  borderRadius: 0,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor:
      theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: theme.palette.mode === 'light' ? '#1a90ff' : '#308fe8',
  },
}));

/**
 * Props for the CustomProgressBar component
 */
type CustomProgressBarProps = {
  /** Number representing Omni faction trust points */
  omni: number;
  /** Number representing Evos faction trust points */
  evos: number;
  /** Number representing Warbotics faction trust points */
  warbotics: number;
};

/**
 * Custom progress bar component that displays trust percentages for three factions
 * @param props - The component props
 * @param props.omni - Omni faction trust points
 * @param props.evos - Evos faction trust points
 * @param props.warbotics - Warbotics faction trust points
 * @returns JSX element displaying three progress bars side by side
 */
function CustomProgressBar({ omni, evos, warbotics }: CustomProgressBarProps) {
  const total = omni + evos + warbotics;
  let percentage1 = (omni / total) * 100;
  let percentage2 = (evos / total) * 100;
  let percentage3 = (warbotics / total) * 100;

  // Handle NaN values when total is 0
  if (Number.isNaN(percentage1)) percentage1 = 0;
  if (Number.isNaN(percentage2)) percentage2 = 0;
  if (Number.isNaN(percentage3)) percentage3 = 0;

  // Render the progress bars
  return (
    <Box display="flex" flexDirection="row" justifyContent="space-between">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Typography variant="body2" style={{ zIndex: 1000 }}>
          Omni {percentage1.toFixed(1)}%
        </Typography>
        <BorderLinearProgress
          variant="determinate"
          value={0}
          style={{
            backgroundColor: '#a96eff',
            flexGrow: percentage1,
            width: '100%',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Typography variant="body2" style={{ zIndex: 1000 }}>
          Evos {percentage2.toFixed(1)}%
        </Typography>
        <BorderLinearProgress
          variant="determinate"
          value={0}
          style={{
            backgroundColor: '#27bcb9',
            flexGrow: percentage2,
            width: '100%',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Typography variant="body2" style={{ zIndex: 1000 }}>
          Warbotics {percentage3.toFixed(1)}%
        </Typography>
        <BorderLinearProgress
          variant="determinate"
          value={0}
          style={{
            backgroundColor: '#9da10c',
            flexGrow: percentage3,
            width: '100%',
          }}
        />
      </div>
    </Box>
  );
}

/**
 * Props for the TrustBar component
 */
interface Props {
  /** Array containing faction data in order: [omni, evos, warbotics] */
  factionsData: number[];
}

/**
 * Main TrustBar component that displays faction trust distribution
 * @param props - The component props
 * @param props.factionsData - Array of numbers representing trust points for each faction
 * @returns JSX element displaying a paper-wrapped trust bar visualization
 */

function TrustBar({ factionsData }: Props) {
  const omni = factionsData[0];
  const evos = factionsData[1];
  const warbotics = factionsData[2];

  return (
    <Paper
      elevation={6}
      sx={{
        p: { xs: 1, sm: 1 },
        m: { xs: '1em' },
        overflow: 'hidden',
        minWidth: 320,
        mx: 'auto',
      }}
    >
      <CustomProgressBar omni={omni} evos={evos} warbotics={warbotics} />
    </Paper>
  );
}

export default TrustBar;
