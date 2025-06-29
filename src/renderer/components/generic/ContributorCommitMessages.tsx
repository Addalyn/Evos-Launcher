/**
 * @fileoverview ContributorCommitMessages component for displaying GitHub commit history.
 * This component fetches and displays commit messages from a GitHub repository,
 * rendering them with Markdown support and providing links to view commits on GitHub.
 * Includes error handling and internationalization support.
 */

/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unstable-nested-components */
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { useTranslation } from 'react-i18next';

/**
 * Props interface for the ContributorCommitMessages component
 * @interface ContributorCommitMessagesProps
 */
interface ContributorCommitMessagesProps {
  /** GitHub username or organization name */
  username: string;
  /** Repository name */
  repo: string;
}

/**
 * Interface representing a GitHub commit object from the GitHub API
 * @interface GithubCommit
 */
interface GithubCommit {
  /** Unique SHA hash identifier for the commit */
  sha: string;
  /** Commit details object */
  commit: {
    /** Commit message text */
    message: string;
    /** Author information */
    author: {
      /** Author's name */
      name: string;
      /** ISO date string of when the commit was authored */
      date: string;
    };
  };
  /** URL to view the commit on GitHub */
  html_url: string;
}

/**
 * ContributorCommitMessages component for displaying GitHub repository commit history.
 *
 * This component fetches commit data from the GitHub API and displays it in a
 * formatted list. Each commit shows the message (with Markdown rendering),
 * author information, date, and a link to view the commit on GitHub.
 *
 * Features:
 * - Fetches commits from GitHub API
 * - Renders commit messages with Markdown support
 * - Displays author name and commit date
 * - Provides links to view commits on GitHub
 * - Includes error handling and loading states
 * - Supports internationalization
 *
 * @component
 * @param {ContributorCommitMessagesProps} props - The component props
 * @param {string} props.username - GitHub username or organization name
 * @param {string} props.repo - Repository name
 * @returns {React.ReactElement} The rendered commit messages component
 *
 * @example
 * ```tsx
 * <ContributorCommitMessages
 *   username="microsoft"
 *   repo="vscode"
 * />
 * ```
 */
function ContributorCommitMessages({
  username,
  repo,
}: ContributorCommitMessagesProps): React.ReactElement {
  /** State to store the fetched GitHub commits */
  const [commits, setCommits] = useState<GithubCommit[]>([]);

  /** State to store any error messages that occur during fetching */
  const [error, setError] = useState<string | null>(null);

  /** Translation hook for internationalization */
  const { t } = useTranslation();

  /**
   * Effect hook to fetch commit data from GitHub API when component mounts
   * or when username/repo props change
   */
  useEffect(() => {
    /**
     * Fetches commit data from the GitHub API
     * @async
     * @function fetchCommitData
     * @returns {Promise<void>} Promise that resolves when fetch is complete
     */
    async function fetchCommitData(): Promise<void> {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${username}/${repo}/commits`,
        );

        if (!response.ok) {
          throw new Error(
            `${t('errors.fetchData')}: ${response.status} ${response.statusText}`,
          );
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            `Invalid data format: expected an array, got ${typeof data}`,
          );
        }

        setCommits(data as GithubCommit[]);
        setError(null); // Clear any previous errors
      } catch (fetchError) {
        const errorMessage =
          fetchError instanceof Error
            ? fetchError.message
            : 'An unknown error occurred';
        setError(errorMessage);
      }
    }

    fetchCommitData();
  }, [username, repo, t]);

  // Early return for error state
  if (error) {
    return <div className="container mt-3">Error: {error}</div>;
  }

  /**
   * Markdown components configuration for custom rendering
   */
  const markdownComponents: Components = {
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
  };

  return (
    <div className="container mt-3">
      <List>
        {commits.map((commit) => (
          <ListItem key={commit.sha} alignItems="flex-start" divider>
            <ListItemText
              primary={
                <Typography variant="body1">
                  {commit.commit.message.split('\n').map((line) => (
                    <React.Fragment
                      key={`${commit.sha}-${line.slice(0, 20)}-${line.length}`}
                    >
                      <Markdown skipHtml components={markdownComponents}>
                        {line}
                      </Markdown>
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
