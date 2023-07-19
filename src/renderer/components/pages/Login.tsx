import { FormEvent, useState } from 'react';
import { useSignIn } from 'react-auth-kit';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EvosStore from 'renderer/lib/EvosStore';
import { login } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';

export default function Login() {
  const { ip, setIp, userName, setUserName } = EvosStore();
  const signIn = useSignIn();

  const navigate = useNavigate();
  const [error, setError] = useState<EvosError>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const user = data.get('username') as string;
    const pass = data.get('password') as string;
    const formIp = data.get('ip') as string;

    if (formIp) {
      setIp(formIp);
      return;
    }

    if (!user || !pass) {
      return;
    }

    const abort = new AbortController();
    login(abort, user, pass)
      // eslint-disable-next-line promise/always-return
      .then((resp) => {
        signIn({
          token: resp.data.token,
          expiresIn: 3600,
          tokenType: 'bearer',
          authState: resp.data,
        });
        setUserName(user);
        navigate('/');
      })
      // eslint-disable-next-line @typescript-eslint/no-shadow
      .catch((error) => {
        processError(
          error,
          setError,
          () => setError({ text: 'Invalid username or password.' }),
          () => {}
        );
        setUserName('');
      });

    // eslint-disable-next-line consistent-return
    return () => abort.abort();
  };

  const handleResetClick = () => {
    setIp('');
    setUserName('');
    setError(undefined);
    localStorage.clear();
  };

  return (
    <Box
      sx={{
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        {ip ? (
          <>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete=""
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                autoFocus
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
                Sign In
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
                    href="#s"
                    sx={{
                      textDecoration: 'none',
                      color: 'grey',
                      pointerEvents: 'none',
                    }}
                  >
                    Sign Up
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </>
        ) : (
          <>
            <Typography component="h1" variant="h5">
              Enter the ip or address of the Atlas Reactor server
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="ip"
                label="IP or Hostname"
                name="ip"
                autoComplete=""
                autoFocus
              />
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
        )}
      </Paper>
    </Box>
  );
}
