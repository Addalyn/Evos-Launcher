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
import { login } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';
import { useTranslation } from 'react-i18next';

export default function AddAccount() {
  const { t } = useTranslation();

  const validationSchemaUser = z.object({
    username: z.string().min(4, { message: t('errors.username2Char') }),
    password: z.string().min(1, { message: t('errors.passwordRequired') }),
  });

  type ValidationSchemaUser = z.infer<typeof validationSchemaUser>;

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
  } = useForm<ValidationSchemaUser>({
    resolver: zodResolver(validationSchemaUser),
  });

  const onSubmit: SubmitHandler<ValidationSchemaUser> = async (data) => {
    const { username, password } = data;

    if (!username || !password) {
      return;
    }

    const abort = new AbortController();

    login(abort, username, password)
      // eslint-disable-next-line promise/always-return
      .then((resp) => {
        if (authenticatedUsers.find((u) => u.user === username)) {
          const authenticatedUser = authenticatedUsers.find(
            (u) => u.user === username,
          ) as AuthUser;
          updateAuthenticatedUsers(
            authenticatedUser.user,
            resp.data.token,
            resp.data.handle,
            resp.data.banner,
            authenticatedUser.configFile,
          );
        } else {
          setAuthenticatedUsers(
            username,
            resp.data.token,
            resp.data.handle,
            resp.data.banner,
          );
        }
        setError(undefined);
        navigate('/');
        switchUser(username);
        return null;
      })
      // eslint-disable-next-line @typescript-eslint/no-shadow
      .catch((error) => {
        processError(
          error,
          setError,
          () => setError({ text: t('errors.invalidUserOrPass') }),
          () => {},
          t,
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
        {t('addAccount')}
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
          {t('addAccountAndSwitch')}
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
              {t('resetApp')}
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
              {t('register')}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
