/* eslint-disable react/jsx-props-no-spreading */
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { z } from 'zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import EvosStore from 'renderer/lib/EvosStore';

const validationSchema = z.object({
  ipadress: z.union([
    z.string().ip({
      message: 'Invalid Ip Adress or Hostname (no port nr and no http(s)://)',
    }),
    z.string().regex(/^(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/),
  ]),
});

type ValidationSchema = z.infer<typeof validationSchema>;

function IpComponent() {
  const { setIp } = EvosStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidationSchema>({
    resolver: zodResolver(validationSchema),
  });

  const onSubmit: SubmitHandler<ValidationSchema> = async (data) => {
    const { ipadress } = data;
    setIp(ipadress);
  };

  return (
    <>
      <Typography component="h1" variant="h5">
        Enter the ip or address of the Atlas Reactor server
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
          id="ip"
          label="IP or Hostname"
          autoComplete=""
          autoFocus
          {...register('ipadress')}
        />
        {errors.ipadress && (
          <Alert severity="warning">{errors.ipadress?.message}</Alert>
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
          Submit
        </Button>
      </Box>
    </>
  );
}

export default IpComponent;
