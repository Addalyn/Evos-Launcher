import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EvosStore, { AuthUser } from 'renderer/lib/EvosStore';
import { login } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';

export default function AddAccount() {
  const {
    setIp,
    setAuthenticatedUsers,
    authenticatedUsers,
    switchUser,
    updateAuthenticatedUsers,
  } = EvosStore();

  const navigate = useNavigate();
  const [error, setError] = useState<EvosError>();
  const [username, setUsername] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let user = data.get('username') as string;
    const pass = data.get('password') as string;

    if (!user || !pass) {
      return;
    }

    user = user.toLowerCase();

    const abort = new AbortController();

    login(abort, user, pass)
      // eslint-disable-next-line promise/always-return
      .then((resp) => {
        if (authenticatedUsers.find((u) => u.user === user)) {
          const authenticatedUser = authenticatedUsers.find(
            (u) => u.user === user
          ) as AuthUser;
          updateAuthenticatedUsers(
            authenticatedUser.user,
            resp.data.token,
            resp.data.handle,
            resp.data.banner,
            authenticatedUser.configFile
          );
        } else {
          setAuthenticatedUsers(
            user,
            resp.data.token,
            resp.data.handle,
            resp.data.banner
          );
        }
        navigate('/');
        switchUser(user);
        window.location.reload();
        return null;
      })
      // eslint-disable-next-line @typescript-eslint/no-shadow
      .catch((error) => {
        processError(
          error,
          setError,
          () => setError({ text: 'Invalid username or password.' }),
          () => {}
        );
      });

    // eslint-disable-next-line consistent-return
    return () => abort.abort();
  };

  const handleResetClick = () => {
    setIp('');
    setError(undefined);
    window.electron.store.clear();
  };

  return (
    <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
      <Typography component="h1" variant="h5">
        Add Account
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username"
          name="username"
          autoComplete=""
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
        />
        {error && error.text}
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
          Add account and switch to account
        </Button>
        <Grid container spacing={2}>
          <Grid item xs={9}>
            <Button
              onClick={handleResetClick}
              sx={{
                textDecoration: 'none',
                color: 'grey',
              }}
            >
              Reset Application
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button
              onClick={() => navigate('/register')}
              sx={{
                textDecoration: 'none',
                color: 'grey',
              }}
            >
              Sign Up
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
