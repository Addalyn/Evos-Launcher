/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Container, Box, Divider, Paper } from '@mui/material';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';

function AboutPage() {
  const [readmeContent, setReadmeContent] = useState('');

  useEffect(() => {
    const githubApiUrl =
      'https://raw.githubusercontent.com/Addalyn/Evos-Launcher/main/README.md';

    fetch(githubApiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then((data) => {
        setReadmeContent(data);
        return data;
      })
      .catch((error) => {
        throw new Error('Error fetching README.md:');
      });
  }, []);

  return (
    <Paper
      elevation={3}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        margin: '1em',
        padding: '1px',
        paddingLeft: '12px',
        paddingBottom: '0px',
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Evos Launcher by Babymillie (Addalyn)
      </Typography>
      <Typography variant="body1" gutterBottom>
        <ReactMarkdown
          skipHtml
          components={{
            a: ({ node, ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'unset' }}
              />
            ),
          }}
        >
          {readmeContent}
        </ReactMarkdown>
      </Typography>
    </Paper>
  );
}

export default AboutPage;
