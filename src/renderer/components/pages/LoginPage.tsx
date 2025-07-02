/**
 * @fileoverview User login page component for the Evos Launcher
 * Handles user authentication, server selection, and login form validation.
 * Provides account management, auto-login functionality, and user registration navigation.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  SubmitHandler,
  useForm,
  UseFormRegister,
  FieldErrors,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  TextField,
  Paper,
  MenuItem,
  Select,
  ListSubheader,
  Avatar,
  Alert,
  AlertTitle,
  Grid,
  Box,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import EvosStore, { AuthUser } from 'renderer/lib/EvosStore';
import { login, getPlayerInfo } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';
import { BannerType, playerBanner } from 'renderer/lib/Resources';
import { withElectron } from 'renderer/utils/electronUtils';
import IpComponent from '../generic/IpComponent';

// Constants
const CONTAINER_STYLES = {
  padding: '1em',
  margin: '1em',
  width: '578px',
};

const USER_AVATAR_STYLES = {
  display: 'flex',
  alignItems: 'center',
  maxHeight: '36.5px',
};

const ADD_ACCOUNT_STYLES = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  minHeight: '36.5px',
};

// Types
interface LoginFormData {
  username: string;
  password: string;
}

// Custom Hooks

/**
 * Custom hook that encapsulates all authentication-related logic and state
 * Manages login, logout, user switching, error handling, and navigation
 * @returns {Object} Authentication state and handlers
 */
const useAuthenticationLogic = () => {
  const {
    ip,
    setIp,
    setAuthenticatedUsers,
    authenticatedUsers,
    switchUser,
    activeUser,
    updateAuthenticatedUsers,
  } = EvosStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<EvosError>();

  /**
   * Checks if the current user is authenticated
   * @returns {boolean} True if user has valid token, false otherwise
   */
  const isAuthenticated = useCallback(() => {
    return activeUser !== null && activeUser?.token !== '';
  }, [activeUser]);

  /**
   * Handles user login process
   * Makes API call to authenticate user and updates store with user data
   * @param {string} username - User's username
   * @param {string} password - User's password
   */
  const handleLogin = useCallback(
    async (username: string, password: string) => {
      if (!username || !password) return;

      const abort = new AbortController();

      try {
        const resp = await login(abort, username, password);

        const existingUser = authenticatedUsers.find(
          (u) => u.user === username,
        );

        // Update existing user or add new user to authenticated users list
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
      } catch (loginError) {
        processError(
          loginError,
          setError,
          () => setError({ text: t('errors.invalidUserOrPass') }),
          () => {},
          t,
        );
      }
    },
    [
      authenticatedUsers,
      updateAuthenticatedUsers,
      setAuthenticatedUsers,
      switchUser,
      navigate,
      t,
    ],
  );

  /**
   * Resets the application to initial state
   * Clears IP, errors, and electron store data
   */
  const handleReset = useCallback(() => {
    setIp('');
    setError(undefined);
    withElectron((electron) => electron.store.clear());
  }, [setIp]);

  /**
   * Switches to a different authenticated user and navigates to home
   * @param {string} username - Username to switch to
   */
  const handleUserSwitch = useCallback(
    (username: string) => {
      switchUser(username);
      // If not authenticated, do not redirect to home
      if (!isAuthenticated()) {
        return;
      }
      // Navigate to home page after switching user
      navigate('/');
    },
    [switchUser, isAuthenticated, navigate],
  );

  return {
    ip,
    authenticatedUsers,
    activeUser,
    error,
    isAuthenticated,
    handleLogin,
    handleReset,
    handleUserSwitch,
  };
};

// Components

/**
 * Renders the "Add Account" menu item in the user selector
 * @param {Object} props - Component props
 * @param {Function} props.onAddUser - Callback function to handle adding new user
 * @returns {JSX.Element} MenuItem component for adding new account
 */
function AddAccountMenuItem({ onAddUser }: { onAddUser: () => void }) {
  const { t } = useTranslation();

  return (
    <MenuItem value="__add_account__" onClick={onAddUser}>
      <div style={ADD_ACCOUNT_STYLES}>{t('addAccount')}</div>
    </MenuItem>
  );
}

/**
 * Renders a dropdown selector for switching between authenticated users
 * Shows list of authenticated users and option to add new account
 * @param {Object} props - Component props
 * @param {AuthUser|null} props.activeUser - Currently active user
 * @param {AuthUser[]} props.authenticatedUsers - Array of authenticated users
 * @param {Function} props.onUserSwitch - Callback for user switching
 * @param {Function} props.onAddUser - Callback for adding new user
 * @returns {JSX.Element} Select component with user options
 */
function UserSelector({
  activeUser,
  authenticatedUsers,
  onUserSwitch,
  onAddUser,
}: {
  activeUser: AuthUser | null;
  authenticatedUsers: AuthUser[];
  onUserSwitch: (username: string) => void;
  onAddUser: () => void;
}) {
  const { t } = useTranslation();
  // Ensure we have a valid value - use activeUser if it exists in authenticatedUsers, otherwise use first user or empty string
  const getSelectValue = () => {
    if (
      activeUser &&
      authenticatedUsers.some((u) => u.user === activeUser.user)
    ) {
      return activeUser.user;
    }
    return authenticatedUsers.length > 0 ? authenticatedUsers[0].user : '';
  };
  return (
    <Select
      required
      value={getSelectValue()}
      id="username"
      sx={{ width: '100%' }}
      onChange={(e) => {
        const value = e.target.value as string;
        if (!value) return;
        if (value === '__add_account__') {
          onAddUser();
        } else {
          onUserSwitch(value);
        }
      }}
    >
      <ListSubheader>{t('accounts')}</ListSubheader>
      {authenticatedUsers.map((user) => (
        <MenuItem key={user.user} value={user.user}>
          <div style={USER_AVATAR_STYLES}>
            {user?.handle}
            <Avatar
              alt="Avatar"
              src={playerBanner(BannerType.foreground, user.banner ?? 65)}
              sx={{ width: 64, height: 64, marginRight: '16px' }}
            />
          </div>
        </MenuItem>
      ))}
      <AddAccountMenuItem onAddUser={onAddUser} />
    </Select>
  );
}

/**
 * Main login form component
 * Handles both new user login and existing user selection
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Form submission handler
 * @param {any} props.register - React Hook Form register function
 * @param {any} props.errors - Form validation errors
 * @param {boolean} props.showUsernameField - Whether to show username input field
 * @param {AuthUser|null} props.activeUser - Currently active user
 * @param {AuthUser[]} props.authenticatedUsers - Array of authenticated users
 * @param {Function} props.onUserSwitch - Callback for user switching
 * @param {Function} props.onAddUser - Callback for adding new user
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @returns {JSX.Element} Login form component
 */
function LoginForm({
  onSubmit,
  register,
  errors,
  showUsernameField,
  activeUser,
  authenticatedUsers,
  onUserSwitch,
  onAddUser,
  isAuthenticated,
}: {
  onSubmit: (e: React.FormEvent) => void;
  register: UseFormRegister<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  showUsernameField: boolean;
  activeUser: AuthUser | null;
  authenticatedUsers: AuthUser[];
  onUserSwitch: (username: string) => void;
  onAddUser: () => void;
  isAuthenticated: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
      {/* Conditional rendering: username field for new users, selector for existing users */}
      {showUsernameField ? (
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
      ) : (
        <UserSelector
          activeUser={activeUser}
          authenticatedUsers={authenticatedUsers}
          onUserSwitch={onUserSwitch}
          onAddUser={onAddUser}
        />
      )}

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
        {...register('password')}
      />

      {errors.password && (
        <Alert severity="warning">{errors.password?.message}</Alert>
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
        {!isAuthenticated ? t('login') : t('addAccountAndSwitch')}
      </Button>
    </Box>
  );
}

/**
 * Action buttons component for reset and registration navigation
 * @param {Object} props - Component props
 * @param {Function} props.onReset - Callback for resetting the application
 * @param {Function} props.onNavigateToRegister - Callback for navigating to register page
 * @returns {JSX.Element} Grid layout with action buttons
 */
function ActionButtons({
  onReset,
  onNavigateToRegister,
}: {
  onReset: () => void;
  onNavigateToRegister: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Grid
      container
      spacing={2}
      justifyContent="space-between"
      alignItems="center"
    >
      <Grid item>
        <Button
          onClick={onReset}
          sx={{
            textDecoration: 'none',
            color: 'grey',
          }}
        >
          {t('resetApp')}
        </Button>
      </Grid>
      <Grid item>
        <Button
          onClick={onNavigateToRegister}
          sx={{
            textDecoration: 'none',
            color: 'grey',
          }}
        >
          {t('register')}
        </Button>
      </Grid>
    </Grid>
  );
}

/**
 * Main LoginPage component
 * Handles user authentication, login form display, and navigation
 * Supports both new user registration and existing user selection
 * @returns {JSX.Element} Complete login page with form and navigation
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [addUser, setAddUser] = useState(false);

  const {
    ip,
    authenticatedUsers,
    activeUser,
    error,
    isAuthenticated,
    handleLogin,
    handleReset,
    handleUserSwitch,
  } = useAuthenticationLogic();

  // Determine whether to show username field or user selector
  const showUsernameField = authenticatedUsers.length === 0 || addUser;

  const validationSchema = useMemo(() => {
    return z.object({
      username: showUsernameField
        ? z.string().min(2, { message: t('errors.username2Char') })
        : z.string().optional(),
      password: z.string().min(1, { message: t('errors.passwordRequired') }),
    });
  }, [t, showUsernameField]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(validationSchema),
  });

  // Auto-navigate if already authenticated
  useEffect(() => {
    const checkUserSession = async () => {
      if (
        ip !== undefined &&
        authenticatedUsers !== null &&
        activeUser !== null &&
        activeUser?.token !== '' &&
        addUser === false
      ) {
        try {
          const response = await getPlayerInfo(`Bearer ${activeUser.token}`);

          if (response) {
            navigate('/');
          }
        } catch (sessionError) {
          // Handle the error silently or log it using a monitoring tool
        }
      }
    };

    checkUserSession();
  }, [addUser, authenticatedUsers, activeUser, ip, navigate]);

  /**
   * Handles form submission for login
   * @param {LoginFormData} data - Form data containing username and password
   */
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    // For user selector mode, get username from activeUser instead of form data
    const username = showUsernameField ? data.username : activeUser?.user;

    if (!username) {
      return;
    }

    await handleLogin(username, data.password);
    setAddUser(false);
  };

  /**
   * Sets the component to add user mode (shows username input field)
   */
  const handleAddUser = () => {
    setAddUser(true);
  };

  /**
   * Navigates to the registration page
   */
  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  return (
    <Paper elevation={3} style={CONTAINER_STYLES}>
      {ip ? (
        <>
          <Typography component="h1" variant="h5">
            {t('login')}
          </Typography>

          <LoginForm
            onSubmit={handleSubmit(onSubmit)}
            register={register}
            errors={errors}
            showUsernameField={showUsernameField}
            activeUser={activeUser}
            authenticatedUsers={authenticatedUsers}
            onUserSwitch={handleUserSwitch}
            onAddUser={handleAddUser}
            isAuthenticated={isAuthenticated()}
          />

          {error && (
            <Alert severity="error">
              <AlertTitle>{t('error')}</AlertTitle>
              {error.text}
            </Alert>
          )}

          <ActionButtons
            onReset={handleReset}
            onNavigateToRegister={handleNavigateToRegister}
          />
        </>
      ) : (
        <IpComponent />
      )}
    </Paper>
  );
}
