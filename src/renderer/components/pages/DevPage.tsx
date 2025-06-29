/**
 * @fileoverview Developer page for viewing JSDoc documentation and debugging tools
 * Provides a comprehensive interface for exploring source code documentation,
 * file structure analysis, and development utilities for the Evos Launcher.
 * @author Evos Launcher Team
 * @since 2.0.0
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { withElectron } from 'renderer/utils/electronUtils';

/**
 * Interface representing a parsed JSDoc comment block
 */
interface JSDocComment {
  /** Original file path where the comment was found */
  filePath: string;
  /** Line number where the comment starts */
  lineNumber: number;
  /** The complete comment text */
  rawComment: string;
  /** Parsed file overview description */
  fileoverview?: string;
  /** Parsed author information */
  author?: string;
  /** Parsed since version */
  since?: string;
  /** Parsed function/class name */
  functionName?: string;
  /** Parsed description */
  description?: string;
  /** Parsed parameters */
  params?: Array<{ name: string; type: string; description: string }>;
  /** Parsed return information */
  returns?: { type: string; description: string };
  /** Interface or type definition */
  interface?: string;
  /** Additional tags */
  tags?: Array<{ tag: string; content: string }>;
}

/**
 * Main DevPage component providing JSDoc documentation viewer and development tools
 * @returns React functional component
 */
export default function DevPage(): React.JSX.Element {
  const { t } = useTranslation();

  // State management
  const [sourceFiles, setSourceFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [jsDocComments, setJSDocComments] = useState<JSDocComment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Parses JSDoc comments from source code text
   * @param content - Raw source code content
   * @param filePath - Path to the source file
   * @returns Array of parsed JSDoc comments
   */
  const parseJSDocComments = useCallback(
    (content: string, filePath: string): JSDocComment[] => {
      const comments: JSDocComment[] = [];
      const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;

      let match: RegExpExecArray | null;
      // eslint-disable-next-line no-cond-assign
      while ((match = jsdocRegex.exec(content)) !== null) {
        const commentText = match[0];
        const commentStart = content
          .substring(0, match.index)
          .split('\n').length;

        // Parse the comment
        const parsed: JSDocComment = {
          filePath,
          lineNumber: commentStart,
          rawComment: commentText,
          params: [],
          tags: [],
        };

        // Extract various JSDoc tags
        const tagRegex = /@(\w+)\s+(.+?)(?=\n\s*\*\s*@|\n\s*\*\/)/gs;
        let tagMatch: RegExpExecArray | null;

        // eslint-disable-next-line no-cond-assign
        while ((tagMatch = tagRegex.exec(commentText)) !== null) {
          const tagName = tagMatch[1];
          const tagContent = tagMatch[2].replace(/\n\s*\*\s*/g, ' ').trim();

          switch (tagName) {
            case 'fileoverview': {
              parsed.fileoverview = tagContent;
              break;
            }
            case 'author': {
              parsed.author = tagContent;
              break;
            }
            case 'since': {
              parsed.since = tagContent;
              break;
            }
            case 'param': {
              const paramMatch = tagContent.match(
                /^{([^}]+)}\s+(\w+)\s*-?\s*(.*)$/,
              );
              if (paramMatch) {
                parsed.params!.push({
                  name: paramMatch[2],
                  type: paramMatch[1],
                  description: paramMatch[3],
                });
              }
              break;
            }
            case 'returns': {
              const returnsMatch = tagContent.match(/^{([^}]+)}\s*(.*)$/);
              if (returnsMatch) {
                parsed.returns = {
                  type: returnsMatch[1],
                  description: returnsMatch[2],
                };
              }
              break;
            }
            case 'interface': {
              parsed.interface = tagContent;
              break;
            }
            default: {
              parsed.tags!.push({ tag: tagName, content: tagContent });
              break;
            }
          }
        }

        // Extract description (text before first @tag)
        const descMatch = commentText.match(
          /\/\*\*\s*\n\s*\*\s*(.*?)(?=\n\s*\*\s*@|\*\/)/s,
        );
        if (descMatch) {
          parsed.description = descMatch[1].replace(/\n\s*\*\s*/g, ' ').trim();
        }

        // Try to find the function/class name after the comment
        const afterComment = content.substring(match.index + match[0].length);
        const functionMatch = afterComment.match(
          /^\s*(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|class\s+(\w+)|interface\s+(\w+)|const\s+(\w+)|export\s+(?:default\s+)?(?:function\s+)?(\w+))/,
        );
        if (functionMatch) {
          parsed.functionName =
            functionMatch[1] ||
            functionMatch[2] ||
            functionMatch[3] ||
            functionMatch[4] ||
            functionMatch[5];
        }

        comments.push(parsed);
      }

      return comments;
    },
    [],
  );

  /**
   * Loads and analyzes source files for JSDoc documentation
   */
  const loadSourceFiles = useCallback(async () => {
    setLoading(true);
    try {
      // Get list of TypeScript/JavaScript files
      const response = await withElectron(
        (electron) => electron.ipcRenderer.getSourceFiles(),
        null,
      );
      if (response) {
        setSourceFiles(response);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading source files:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Loads content of a specific file and parses its JSDoc comments
   * @param filePath - Path to the file to analyze
   */
  const loadFileContent = useCallback(
    async (filePath: string) => {
      if (!filePath) return;

      setLoading(true);
      try {
        const content = await withElectron(
          (electron) => electron.ipcRenderer.readFileContent(filePath),
          null,
        );

        if (content) {
          const comments = parseJSDocComments(content, filePath);
          setJSDocComments(comments);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading file content:', error);
      } finally {
        setLoading(false);
      }
    },
    [parseJSDocComments],
  );

  /**
   * Filters JSDoc comments based on search term and filter type
   */
  const filteredComments = useMemo(() => {
    let filtered = jsDocComments;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((comment) => {
        switch (filterType) {
          case 'fileoverview':
            return comment.fileoverview;
          case 'functions':
            return comment.functionName && !comment.interface;
          case 'interfaces':
            return comment.interface;
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (comment) =>
          comment.description?.toLowerCase().includes(term) ||
          comment.functionName?.toLowerCase().includes(term) ||
          comment.fileoverview?.toLowerCase().includes(term) ||
          comment.author?.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [jsDocComments, searchTerm, filterType]);

  // Load source files on component mount
  useEffect(() => {
    loadSourceFiles();
  }, [loadSourceFiles]);

  // Load file content when selection changes
  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile);
    }
  }, [selectedFile, loadFileContent]);

  const getFileName = (fullPath: string) => fullPath.replace(/.*[/\\]/, '');

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <CodeIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h4" gutterBottom>
              {t('dev.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('dev.subtitle')}
            </Typography>
          </Box>
          <Box ml="auto">
            <Tooltip title={t('dev.refresh')}>
              <IconButton onClick={loadSourceFiles} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Controls */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('dev.selectFile')}</InputLabel>
              <Select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                label={t('dev.selectFile')}
              >
                {sourceFiles.map((file) => (
                  <MenuItem key={file} value={file}>
                    {getFileName(file)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('dev.filterType')}</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label={t('dev.filterType')}
              >
                <MenuItem value="all">{t('dev.allDocs')}</MenuItem>
                <MenuItem value="fileoverview">
                  {t('dev.fileOverviews')}
                </MenuItem>
                <MenuItem value="functions">{t('dev.functions')}</MenuItem>
                <MenuItem value="interfaces">{t('dev.interfaces')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label={t('dev.searchDocs')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {selectedFile && (
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('dev.docsFor')}: {getFileName(selectedFile)}
          </Typography>

          {filteredComments.length === 0 ? (
            <Alert severity="info">{t('dev.noComments')}</Alert>
          ) : (
            <Box>
              {filteredComments.map((comment) => (
                <Accordion
                  key={`${comment.filePath}-${comment.lineNumber}`}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={2} flex={1}>
                      <DescriptionIcon color="primary" />
                      <Typography variant="h6">
                        {comment.functionName ||
                          comment.interface ||
                          t('dev.fileOverview')}
                      </Typography>
                      <Box ml="auto" display="flex" gap={1}>
                        {comment.fileoverview && (
                          <Chip
                            label={t('dev.file')}
                            size="small"
                            color="primary"
                          />
                        )}
                        {comment.functionName && (
                          <Chip
                            label={t('dev.function')}
                            size="small"
                            color="secondary"
                          />
                        )}
                        {comment.interface && (
                          <Chip
                            label={t('dev.interface')}
                            size="small"
                            color="success"
                          />
                        )}
                        <Chip
                          label={`${t('dev.line')} ${comment.lineNumber}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Description */}
                      {(comment.description || comment.fileoverview) && (
                        <Grid item xs={12}>
                          <Typography variant="body1" paragraph>
                            {comment.fileoverview || comment.description}
                          </Typography>
                        </Grid>
                      )}

                      {/* Metadata */}
                      {(comment.author || comment.since) && (
                        <Grid item xs={12}>
                          <Box display="flex" gap={2} flexWrap="wrap">
                            {comment.author && (
                              <Chip
                                label={`${t('dev.author')}: ${comment.author}`}
                                variant="outlined"
                                size="small"
                              />
                            )}
                            {comment.since && (
                              <Chip
                                label={`${t('dev.since')}: ${comment.since}`}
                                variant="outlined"
                                size="small"
                              />
                            )}
                          </Box>
                        </Grid>
                      )}

                      {/* Parameters */}
                      {comment.params && comment.params.length > 0 && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            {t('dev.parameters')}:
                          </Typography>
                          <List dense>
                            {comment.params.map((param) => (
                              <ListItem
                                key={`${comment.filePath}-${comment.lineNumber}-param-${param.name}`}
                                divider
                              >
                                <ListItemText
                                  primary={
                                    <Box>
                                      <Typography
                                        component="span"
                                        fontWeight="bold"
                                      >
                                        {param.name}
                                      </Typography>
                                      <Typography
                                        component="span"
                                        color="text.secondary"
                                        sx={{ ml: 1 }}
                                      >
                                        ({param.type})
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={param.description}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      )}

                      {/* Returns */}
                      {comment.returns && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            {t('dev.returns')}:
                          </Typography>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="body2" fontWeight="bold">
                                {comment.returns.type}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {comment.returns.description}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}

                      {/* Additional Tags */}
                      {comment.tags && comment.tags.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            {t('dev.additionalTags')}:
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {comment.tags.map((tag) => (
                              <Chip
                                key={`${comment.filePath}-${comment.lineNumber}-tag-${tag.tag}-${tag.content.slice(0, 10)}`}
                                label={`@${tag.tag}: ${tag.content}`}
                                variant="outlined"
                                size="small"
                              />
                            ))}
                          </Box>
                        </Grid>
                      )}

                      {/* Raw Comment */}
                      <Grid item xs={12}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2">
                              {t('dev.viewRaw')}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                bgcolor: 'background.default',
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Typography
                                component="pre"
                                variant="body2"
                                sx={{
                                  whiteSpace: 'pre-wrap',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                  color: 'text.primary',
                                  margin: 0,
                                  lineHeight: 1.4,
                                }}
                              >
                                {comment.rawComment || 'No raw comment found'}
                              </Typography>
                            </Paper>
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
}
