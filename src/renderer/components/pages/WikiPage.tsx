import React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Theme } from '@mui/material/styles';

function WikiPage() {
  const isXs = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

  const iframeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: isXs ? '60px' : '240px',
    height: '100%',
    width: isXs ? 'calc(100% - 60px)' : 'calc(100% - 240px)',
    border: 'none',
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <iframe style={iframeStyle} src="https://wiki.evos.live/" title="wiki" />
    </div>
  );
}

export default WikiPage;
