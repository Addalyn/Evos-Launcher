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
import { registerAccount } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';
import { useTranslation } from 'react-i18next';
import { withElectron } from 'renderer/utils/electronUtils';

/**
 * RegisterPage component provides a user registration form with validation.
 *
 * Features:
 * - Form validation using Zod schema and React Hook Form
 * - User registration with username, password, confirm password, and code fields
 * - Error handling and display
 * - Navigation between login and register pages
 * - Application reset functionality
 * - Multi-language support via i18n
 *
 * @returns The registration page component
 */
export default function RegisterPage() {
  /**
   * Destructured state and actions from the Evos store
   */
  const {
    setIp,
    setAuthenticatedUsers,
    authenticatedUsers,
    switchUser,
    updateAuthenticatedUsers,
  } = EvosStore();

  /**
   * React Router navigation hook
   */
  const navigate = useNavigate();

  /**
   * Error state for displaying registration errors
   */
  const [error, setError] = useState<EvosError>();

  /**
   * Translation hook for internationalization
   */
  const { t } = useTranslation();

  /**
   * Zod validation schema for the registration form
   * Validates username, password, confirmPassword, and code fields
   */
  const validationSchema = z
    .object({
      /** Username must be at least 2 characters long */
      username: z.string().min(2, { message: t('errors.username2Char') }),
      /** Password must be at least 5 characters long */
      password: z.string().min(5, { message: t('errors.errorPass') }),
      /** Confirm password must be at least 5 characters long */
      confirmPassword: z
        .string()
        .min(5, { message: t('errors.errorConfirmPass') }),
      /** Code must be a valid UUID format */
      code: z
        .string()
        .regex(
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
          { message: t('errors.errorCode') },
        ),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: t('errors.errorPassMatch'),
    });

  /**
   * TypeScript type inferred from the Zod validation schema
   */
  type ValidationSchema = z.infer<typeof validationSchema>;

  /**
   * React Hook Form setup with Zod resolver for validation
   */
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidationSchema>({
    resolver: zodResolver(validationSchema),
  });

  /**
   * Form submission handler for user registration
   *
   * @param data - The validated form data containing username, password, and code
   * @returns Promise<void | (() => void)> - Returns cleanup function for abort controller
   */

  const onSubmit: SubmitHandler<ValidationSchema> = async (data) => {
    const { username, password, code } = data;

    // Early return if any required fields are missing (shouldn't happen due to validation)
    if (!username || !password || !code) {
      return;
    }

    const abort = new AbortController();

    registerAccount(abort, username, password, code) // Send username instead of user as username can be any capitalization
      // eslint-disable-next-line promise/always-return
      .then((resp) => {
        const existingUser = authenticatedUsers.find(
          (u) => u.user === username,
        );

        if (existingUser) {
          updateAuthenticatedUsers(
            existingUser.user,
            resp.data.token,
            resp.data.handle,
            resp.data.banner,
            existingUser.configFile,
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
        switchUser(username);
        navigate('/');
        return null;
      })
      .catch((registrationError: unknown) => {
        processError(
          registrationError,
          setError,
          () => setError({ text: t('errors.invalidUserOrPass') }),
          () => {},
          t,
        );
      });

    // eslint-disable-next-line consistent-return
    return () => abort.abort();
  };

  /**
   * Handles the application reset functionality
   * Clears IP, error state, and electron store data
   */
  const handleResetClick = () => {
    setIp('');
    setError(undefined);
    withElectron((electron) => electron.store.clear());
  };

  // Render the registration form with Material-UI components
  return (
    <Paper
      elevation={3}
      style={{ padding: '1em', margin: '1em', width: '578px' }}
    >
      <Typography component="h1" variant="h5">
        {t('registerAccount')}
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
          label={t('username')}
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
          label={t('password')}
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
          label={t('confirmPassword')}
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
          label={t('code')}
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
            <AlertTitle>{t('errors.error')}</AlertTitle>
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
          {t('registerAccount')}
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
              onClick={() => navigate('/login')}
              sx={{
                textDecoration: 'none',
                color: 'grey',
              }}
            >
              {t('login')}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
