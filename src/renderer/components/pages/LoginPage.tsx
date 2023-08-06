/* eslint-disable react/jsx-props-no-spreading */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import {
  Paper,
  MenuItem,
  Select,
  ListSubheader,
  Avatar,
  Alert,
  AlertTitle,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EvosStore, { AuthUser } from 'renderer/lib/EvosStore';
import { login } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';
import { BannerType, playerBanner } from 'renderer/lib/Resources';
import IpComponent from '../generic/IpComponent';

const validationSchemaUser = z.object({
  username: z
    .string()
    .min(2, { message: 'Username must be atleast 2 characters' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type ValidationSchemaUser = z.infer<typeof validationSchemaUser>;

export default function LoginPage() {
  const {
    ip,
    setIp,
    setAuthenticatedUsers,
    authenticatedUsers,
    switchUser,
    activeUser,
    updateAuthenticatedUsers,
  } = EvosStore();

  const [addUser, setAddUser] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState<EvosError>();

  const isAuthenticated = () => {
    return activeUser !== null && activeUser?.token !== '';
  };

  const handleAddUser = () => {
    setAddUser(true);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidationSchemaUser>({
    resolver: zodResolver(validationSchemaUser),
  });

  const onSubmit: SubmitHandler<ValidationSchemaUser> = async (data) => {
    const { username, password } = data;

    if (!username || !password) {
      return;
    }

    const user = username.toLowerCase();

    const abort = new AbortController();

    login(abort, user, password)
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
        setError(undefined);
        setAddUser(false);
        switchUser(user);
        navigate('/');
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
    <Paper
      elevation={3}
      style={{ padding: '1em', margin: '1em', width: '578px' }}
    >
      {ip ? (
        <>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ mt: 1 }}
          >
            {authenticatedUsers.length === 0 || addUser ? (
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                autoComplete=""
                autoFocus
                {...register('username')}
              />
            ) : (
              <Select
                required
                value={activeUser?.user}
                label=""
                id="username"
                {...register('username')}
                sx={{ width: '100%' }}
                onChange={(e) => {
                  switchUser(e.target.value.toLowerCase() as string);
                  navigate('/');
                }}
              >
                <ListSubheader>Accounts</ListSubheader>
                {authenticatedUsers.map((user) => (
                  <MenuItem key={user.user} value={user.user}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        maxHeight: '36.5px',
                      }}
                    >
                      {user?.handle}
                      <Avatar
                        alt="Avatar"
                        src={playerBanner(
                          BannerType.foreground,
                          user.banner ?? 65
                        )}
                        sx={{ width: 64, height: 64, marginRight: '16px' }}
                      />
                    </div>
                  </MenuItem>
                ))}
                <MenuItem onClick={handleAddUser}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      minHeight: '36.5px',
                    }}
                  >
                    Add Account
                  </div>
                </MenuItem>
              </Select>
            )}
            {errors.username && (
              <Alert severity="warning">{errors.username?.message}</Alert>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              id="password"
              {...register('password')}
            />
            {errors.password && (
              <Alert severity="warning">{errors.password?.message}</Alert>
            )}
            {error && (
              <Alert severity="error">
                <AlertTitle>Error</AlertTitle>
                {error.text}
              </Alert>
            )}
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
              {!isAuthenticated()
                ? 'Sign in'
                : 'Add account and switch to account'}
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
        </>
      ) : (
        <IpComponent />
      )}
    </Paper>
  );
}
