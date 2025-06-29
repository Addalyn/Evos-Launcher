/**
 * @fileoverview Page wrapper component with title management
 * Provides document title updates for different pages
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import React, { useEffect } from 'react';
import { PageProps } from '../../types/app.types';

/**
 * Page wrapper component that manages document title
 * @param {PageProps} props - Page component properties
 * @returns {React.ReactElement | null} The page children or null
 */
const Page: React.FC<PageProps> = ({ title, children }) => {
  useEffect(() => {
    document.title = title || 'Atlas Reactor';
  }, [title]);

  return children as React.ReactElement;
};

/**
 * Helper function to create a page with consistent title handling
 * @param {string} title - The page title
 * @param {React.ReactNode} content - The page content
 * @returns {React.ReactElement} The wrapped page content
 */
export const createPage = (
  title: string,
  content: React.ReactNode,
): React.ReactElement => {
  return <Page title={title}>{content}</Page>;
};

export default Page;
