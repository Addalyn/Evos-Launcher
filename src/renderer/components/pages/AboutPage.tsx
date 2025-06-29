/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unstable-nested-components */
import { useEffect, useState } from 'react';
import { Typography, Paper } from '@mui/material';
import Markdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

function AboutPage() {
  const [readmeContent, setReadmeContent] = useState('');
  const { t } = useTranslation();

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
        {t('launcherBy')}
      </Typography>
      <Typography variant="body1" gutterBottom>
        <Markdown
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
            h1: ({ node, ...props }) => (
              <Typography variant="h2" component="h1" gutterBottom>
                {props.children}
              </Typography>
            ),
            h2: ({ node, ...props }) => (
              <Typography variant="h4" component="h2" gutterBottom>
                {props.children}
              </Typography>
            ),
          }}
        >
          {readmeContent}
        </Markdown>
      </Typography>
    </Paper>
  );
}

export default AboutPage;
