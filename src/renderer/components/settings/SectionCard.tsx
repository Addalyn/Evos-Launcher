import React from 'react';
import { Paper, Typography, Divider } from '@mui/material';

type SectionCardProps = {
  title: string | React.ReactNode;
  children: React.ReactNode;
  hidden?: boolean;
};

export default function SectionCard({
  title,
  children,
  hidden = false,
}: SectionCardProps) {
  if (hidden) return null;
  return (
    <Paper
      elevation={6}
      sx={{
        p: { xs: 3, sm: 4 },
        m: { xs: '1em' },
        overflow: 'hidden',
        minWidth: 320,
        mx: 'auto',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );
}

SectionCard.defaultProps = {
  hidden: false,
};
