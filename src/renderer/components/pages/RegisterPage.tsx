/* eslint-disable react/jsx-props-no-spreading */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Paper, Alert, AlertTitle } from '@mui/material';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EvosStore, { AuthUser } from 'renderer/lib/EvosStore';
import { registerAccount } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';

const validationSchema = z
  .object({
    username: z
      .string()
      .min(2, { message: 'Username must be atleast 2 characters' }),
    password: z
      .string()
      .min(5, { message: 'Password must be atleast 5 characters' }),
    confirmPassword: z
      .string()
      .min(5, { message: 'Confirm Password must be atleast 5 characters' }),
    code: z
      .string()
      .regex(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
        { message: 'Please provide a valid Code.' }
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Password don't match",
  });

type ValidationSchema = z.infer<typeof validationSchema>;

export default function RegisterPage() {
  const {
    setIp,
    setAuthenticatedUsers,
    authenticatedUsers,
    switchUser,
    updateAuthenticatedUsers,
  } = EvosStore();

  const navigate = useNavigate();
  const [error, setError] = useState<EvosError>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidationSchema>({
    resolver: zodResolver(validationSchema),
  });

  const onSubmit: SubmitHandler<ValidationSchema> = async (data) => {
    const { username, password, code } = data;

    if (!username || !password || !code) {
      return;
    }

    const user = username.toLowerCase();

    const abort = new AbortController();

    registerAccount(abort, user, password, code)
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
      <Typography component="h1" variant="h5">
        Register Account
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ mt: 1 }}
      >
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
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && (
          <Alert severity="warning">{errors.password?.message}</Alert>
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          autoComplete="current-password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <Alert severity="warning">{errors.confirmPassword?.message}</Alert>
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          label="Code"
          type="text"
          id="code"
          autoComplete="current-code"
          {...register('code')}
        />
        {errors.code && (
          <Alert severity="warning">{errors.code?.message}</Alert>
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
          Register Account
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
              onClick={() => navigate('/login')}
              sx={{
                textDecoration: 'none',
                color: 'grey',
              }}
            >
              Login
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
