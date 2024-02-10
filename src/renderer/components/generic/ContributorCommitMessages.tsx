import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Props {
  username: string;
  repo: string;
}

interface GithubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

function ContributorCommitMessages({ username, repo }: Props) {
  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${username}/${repo}/commits`,
        );
        if (!response.ok) {
          throw new Error(
            `${t('errors.fetchData')}: ${response.status} ${response.statusText}`,
          );
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error(
            `Invalid data format: expected an array, got ${typeof data}`,
          );
        }
        setCommits(data as GithubCommit[]);
      } catch (errorMessage: any) {
        setError(errorMessage?.message);
      }
    }

    fetchData();
  }, [username, repo]);

  if (error) {
    return <div className="container mt-3">Error: {error}</div>;
  }

  return (
    <div className="container mt-3">
      <List>
        {commits.map((commit) => (
          <ListItem key={commit.sha} alignItems="flex-start" divider>
            <ListItemText
              primary={
                <Typography variant="body1">
                  {commit.commit.message.split('\n').map((line, idx) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <React.Fragment key={idx}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </Typography>
              }
              secondary={
                <>
                  <br />
                  <Typography variant="body2" color="text.primary">
                    {commit.commit.author.name}:{' '}
                    {new Date(commit.commit.author.date).toLocaleString()}{' '}
                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'unset' }}
                    >
                      {t('viewOnGitHub')}
                    </a>
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default ContributorCommitMessages;
