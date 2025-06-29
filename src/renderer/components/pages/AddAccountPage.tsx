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
import EvosStore from 'renderer/lib/EvosStore';
import { login } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';
import { useTranslation } from 'react-i18next';
import { withElectron } from 'renderer/utils/electronUtils';

/**
 * Form data structure for user authentication
 */
type ValidationSchemaUser = {
  username: string;
  password: string;
};

/**
 * AddAccount component for handling user authentication and account management.
 * Allows users to add new accounts, login with existing credentials, and manage
 * authenticated users in the application.
 *
 * Features:
 * - User authentication with username/password
 * - Form validation using zod and react-hook-form
 * - Error handling and display
 * - Account switching after successful login
 * - App reset functionality
 * - Navigation to registration page
 *
 * @returns The AddAccount page component
 */
export default function AddAccount() {
  const { t } = useTranslation();

  /**
   * Validation schema for user authentication form
   * Ensures username is at least 4 characters and password is required
   */
  const validationSchemaUser = z.object({
    username: z.string().min(4, { message: t('errors.username2Char') }),
    password: z.string().min(1, { message: t('errors.passwordRequired') }),
  });

  const {
    setIp,
    setAuthenticatedUsers,
    authenticatedUsers,
    switchUser,
    updateAuthenticatedUsers,
  } = EvosStore();

  /** Navigation hook for routing */
  const navigate = useNavigate();

  /** Error state for displaying authentication and validation errors */
  const [error, setError] = useState<EvosError>();

  /** Form management with validation using react-hook-form and zod */
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidationSchemaUser>({
    resolver: zodResolver(validationSchemaUser),
  });

  /**
   * Handles user authentication and account management
   *
   * @param data - Form data containing username and password
   */
  const onSubmit: SubmitHandler<ValidationSchemaUser> = (data) => {
    const { username, password } = data;

    // Early return if required fields are missing
    if (!username || !password) {
      return;
    }

    const abort = new AbortController();

    login(abort, username, password)
      .then((resp) => {
        const existingUser = authenticatedUsers.find(
          (u) => u.user === username,
        );

        if (existingUser) {
          // Update existing user with new authentication data
          updateAuthenticatedUsers(
            existingUser.user,
            resp.data.token,
            resp.data.handle,
            resp.data.banner,
            existingUser.configFile,
          );
        } else {
          // Add new authenticated user
          setAuthenticatedUsers(
            username,
            resp.data.token,
            resp.data.handle,
            resp.data.banner,
          );
        }

        // Clear any previous errors and navigate to home
        setError(undefined);
        navigate('/');
        switchUser(username);

        return true; // Indicate successful login
      })
      .catch((loginError) => {
        processError(
          loginError,
          setError,
          () => setError({ text: t('errors.invalidUserOrPass') }),
          () => {},
          t,
        );
      });
  };

  /**
   * Handles the reset application functionality
   * Clears IP settings, errors, and electron store data
   */
  const handleResetClick = () => {
    setIp('');
    setError(undefined);
    withElectron((electron) => electron.store.clear());
  };

  /**
   * Handles navigation to the registration page
   */
  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
      {/* Page Title */}
      <Typography component="h1" variant="h5">
        {t('addAccount')}
      </Typography>

      {/* Authentication Form */}
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ mt: 1 }}
      >
        {/* Username Input Field */}
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

        {/* Password Input Field */}
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

        {/* Error Display */}
        {error && (
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error.text}
          </Alert>
        )}

        {/* Submit Button */}
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

        {/* Action Buttons Grid */}
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
              onClick={handleRegisterClick}
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
