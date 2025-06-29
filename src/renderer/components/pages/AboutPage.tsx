/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unstable-nested-components */
import { useEffect, useState } from 'react';
import { Typography, Paper } from '@mui/material';
import Markdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

/**
 * AboutPage component that displays the launcher information by fetching
 * and rendering the README.md file from the GitHub repository
 */
function AboutPage() {
  const [readmeContent, setReadmeContent] = useState('');
  const { t } = useTranslation();

  /**
   * Fetches the README.md content from the GitHub repository on component mount
   */
  useEffect(() => {
    const fetchReadmeContent = async () => {
      const githubApiUrl =
        'https://raw.githubusercontent.com/Addalyn/Evos-Launcher/main/README.md';

      try {
        const response = await fetch(githubApiUrl);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch README: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.text();
        setReadmeContent(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching README.md:', error);
        setReadmeContent(
          'Failed to load README content. Please check your internet connection.',
        );
      }
    };

    fetchReadmeContent();
  }, []);

  /**
   * Custom components for rendering markdown elements with Material-UI styling
   */
  const markdownComponents = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    a: ({ node, ...props }: any) => (
      <a
        {...props}
        target="_blank"
        rel="noreferrer"
        style={{ color: 'unset' }}
      />
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    h1: ({ node, ...props }: any) => (
      <Typography variant="h2" component="h1" gutterBottom>
        {props.children}
      </Typography>
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    h2: ({ node, ...props }: any) => (
      <Typography variant="h4" component="h2" gutterBottom>
        {props.children}
      </Typography>
    ),
  };

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
        <Markdown skipHtml components={markdownComponents}>
          {readmeContent}
        </Markdown>
      </Typography>
    </Paper>
  );
}

export default AboutPage;
