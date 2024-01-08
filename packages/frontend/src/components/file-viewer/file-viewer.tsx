/**
 * Copyright 2021 Expedia, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { BoxProps } from '@chakra-ui/react';
import { Box, Flex, HStack, Icon, IconButton, Link, Progress, Spinner, Tooltip, VStack } from '@chakra-ui/react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Helmet } from 'react-helmet';

import { Alert } from '../../components/alert/alert';
import type { Crumb } from '../../components/crumbs/crumbs';
import { Crumbs } from '../../components/crumbs/crumbs';
import { iconFactory, iconFactoryAs } from '../../shared/icon-factory';
import { getMimeTypeDefinition, MIME_VIEWER } from '../../shared/mime-utils';
import { getCompletePath } from '../../shared/url-utils';
import { useScrollToLocation } from '../../shared/use-scroll-to-location';
import { useFetch } from '../../shared/useFetch';
import { MarkdownContainer } from '../markdown-container/markdown-container';
import { CodeRendererAsync as CodeRenderer } from '../renderers/code-renderer/code-renderer-async';
import { CsvRenderer } from '../renderers/csv-renderer/csv-renderer';
import { HtmlRenderer } from '../renderers/html-renderer/html-renderer';
import { ImageRenderer } from '../renderers/image-renderer/image-renderer';
import { JsonRenderer } from '../renderers/json-renderer/json-renderer';
import { PdfRenderer } from '../renderers/pdf-renderer/pdf-renderer';
import { VideoRenderer } from '../renderers/video-renderer/video-renderer';

const getHeaderStyles = (header: 'normal' | 'stealth' | 'none') => {
  switch (header) {
    case 'normal': {
      return [
        {
          bg: 'gray.100',
          borderColor: 'gray.300',
          borderWidth: '1px',
          borderTopRadius: '0.5rem'
        },
        {
          borderTopWidth: 0,
          borderBottomRadius: '0.5rem'
        }
      ];
    }
    case 'stealth': {
      return [{}, { borderRadius: '0.5rem' }];
    }
    case 'none': {
      return [
        {
          display: 'none'
        },
        {
          borderRadius: '0.5rem'
        }
      ];
    }
  }
};

const determineFileUrl = (path, baseAssetUrl, transformAssetUri: ((uri: string) => string) | null | undefined) => {
  if (path === undefined) {
    return '';
  }

  if (transformAssetUri) {
    return getCompletePath(transformAssetUri(path), '');
  }

  return getCompletePath(baseAssetUrl, path);
};

export interface FileViewerProps {
  // Set false to disable downloading the displayed file
  allowDownload?: boolean;

  baseAssetUrl?: string;
  baseLinkUrl?: string;

  // If true, disables the border
  borderless?: boolean;

  breadcrumbs?: Crumb[];

  // Optionally provide preloaded contents;
  // If set, will attempt to avoid redownloading fresh content
  contents?: string;
  // Download Path should be provided if the rendered file path (`path`) is not
  // the same as the path of the file which should be downloaded
  downloadPath?: string;

  // Configures the appearance of the header
  header?: 'normal' | 'stealth' | 'none';

  // Optional header content to include
  headerContent?: ReactElement;
  headerRightContent?: ReactElement;

  // Optional header styles
  headerStyles?: Record<string, any>;

  // Set true to indicate the rendered file is a conversion
  isConverted?: boolean;

  defaultMode?: 'rendered' | 'raw';
  canRender?: boolean;

  mime?: string;
  path?: string;

  // Provides an dynamic alternative to baseAssetUrl
  transformAssetUri?: ((uri: string) => string) | null;
}

export const FileViewer = ({
  allowDownload = true,
  baseAssetUrl = '/',
  baseLinkUrl = '/',
  borderless = false,
  breadcrumbs,
  contents,
  downloadPath,
  header = 'normal',
  headerContent,
  headerRightContent,
  headerStyles = {},
  isConverted = false,
  mime,
  defaultMode = 'rendered',
  canRender = true,
  path,
  transformAssetUri,
  ...props
}: FileViewerProps & BoxProps) => {
  // Scroll to anchor location if needed
  useScrollToLocation();

  const fileUrl = determineFileUrl(path, baseAssetUrl, transformAssetUri);

  const downloadUrl = getCompletePath(baseAssetUrl, downloadPath || path, true);
  const downloadTooltip = `Download file${isConverted ? ' in original format' : ''}`;

  // If the file is converted, this is the download URL for the converted file (download URL is original file)
  const convertedDownloadUrl = isConverted ? getCompletePath(baseAssetUrl, path, true) : undefined;

  const [paused, setPaused] = useState(true);
  const [mode, setMode] = useState(defaultMode);
  const unpause = () => paused && setPaused(false);
  const pause = () => !paused && setPaused(true);

  const {
    fetching,
    data: fetchedContents,
    error: fetchedError
  } = useFetch({
    url: fileUrl ?? '',
    contents,
    method: paused ? 'HEAD' : 'GET'
  });

  let canDisplayRaw = false;
  let canDisplayRendered = canRender;
  const canDownload = allowDownload;
  let renderer: ReactElement | null = null;

  if (fetching) {
    renderer = (
      <Flex my="5rem" mx="auto">
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
      </Flex>
    );
  } else if (fetchedError == null) {
    // Attempt to use the MIME type to determine how to render the file
    const mimeTypeDef = getMimeTypeDefinition(mime);

    if (mimeTypeDef) {
      switch (mimeTypeDef.viewer) {
        case MIME_VIEWER.Markdown: {
          unpause();
          if (mode === 'rendered') {
            renderer = (
              <MarkdownContainer
                p="1rem"
                contents={fetchedContents || ''}
                baseAssetUrl={baseAssetUrl}
                baseLinkUrl={baseLinkUrl}
                transformAssetUri={transformAssetUri}
              />
            );
          } else if (mode === 'raw') {
            renderer = <CodeRenderer contents={fetchedContents} language="markdown" />;
          }
          canDisplayRaw = mode === 'rendered';
          canDisplayRendered = !canDisplayRaw;
          break;
        }

        case MIME_VIEWER.PDF: {
          pause();
          renderer = <PdfRenderer url={fileUrl} />;
          canDisplayRaw = canDisplayRendered = false;
          break;
        }

        case MIME_VIEWER.Code: {
          unpause();
          renderer = <CodeRenderer contents={fetchedContents} language={mimeTypeDef?.editorLanguage} />;
          canDisplayRaw = canDisplayRendered = false;
          break;
        }

        case MIME_VIEWER.Image: {
          pause();
          renderer = <ImageRenderer url={fileUrl} />;
          canDisplayRaw = canDisplayRendered = false;
          break;
        }

        case MIME_VIEWER.Video: {
          pause();
          renderer = <VideoRenderer url={fileUrl} mimeType={mimeTypeDef.mimeType} />;
          canDisplayRaw = canDisplayRendered = false;
          break;
        }

        case MIME_VIEWER.Html: {
          unpause();
          if (mode === 'rendered') {
            renderer = <HtmlRenderer url={convertedDownloadUrl ?? downloadUrl} />;
          } else if (mode === 'raw') {
            renderer = <CodeRenderer contents={fetchedContents} language="xml" />;
          }
          canDisplayRaw = mode === 'rendered';
          canDisplayRendered = !canDisplayRaw;
          break;
        }

        case MIME_VIEWER.Csv: {
          unpause();
          if (mode === 'rendered') {
            renderer = <CsvRenderer contents={fetchedContents} />;
          } else if (mode === 'raw') {
            renderer = <CodeRenderer contents={fetchedContents} language="csv" />;
          }
          canDisplayRaw = mode === 'rendered';
          canDisplayRendered = !canDisplayRaw;
          break;
        }

        case MIME_VIEWER.Json: {
          unpause();
          if (mode === 'rendered') {
            renderer = <JsonRenderer contents={fetchedContents} />;
          } else if (mode === 'raw') {
            renderer = <CodeRenderer contents={fetchedContents} language="json" />;
          }
          canDisplayRaw = mode === 'rendered';
          canDisplayRendered = !canDisplayRaw;
          break;
        }

        case MIME_VIEWER.None: {
          pause();
          renderer = <Alert warning="File type not cannot be previewed." />;
          break;
        }

        default: {
          unpause();
          renderer = <CodeRenderer contents={fetchedContents} />;
          canDisplayRaw = canDisplayRendered = false;
        }
      }
    } else {
      console.log(`Viewing unknown MIME type: ${mime}`);
      unpause();
      renderer = <CodeRenderer contents={fetchedContents} />;
      canDisplayRaw = canDisplayRendered = false;
    }
  } else if (fetchedError === 'Not Found' && isConverted) {
    renderer = (
      <VStack spacing={0} align="stretch">
        <Progress size="xs" isIndeterminate />

        <Alert
          info="
          We're busy converting this file to a format that we can display in browsers. Please wait until the converted
          version is available."
        />
      </VStack>
    );
  } else {
    renderer = <Alert error={fetchedError} />;
  }

  const [defaultHeaderStyles, rendererStyles] = getHeaderStyles(header);
  const borderlessStyles = borderless ? { borderWidth: 0, borderRadius: 0 } : {};

  return (
    <Flex direction="column" {...props}>
      {breadcrumbs && (
        <Helmet>
          <title>{breadcrumbs.map((crumb) => crumb.text).join(' > ')}</title>
        </Helmet>
      )}

      <HStack align="center" p="0.5rem" {...defaultHeaderStyles} {...borderlessStyles} {...headerStyles}>
        {breadcrumbs && <Crumbs crumbs={breadcrumbs} />}

        {isConverted && (
          <Tooltip
            placement="bottom"
            label="This file has been converted to a different file format for viewing"
            aria-label="Converted file"
          >
            <Box ml="0.5rem">
              <Icon as={iconFactory('converted')} />
            </Box>
          </Tooltip>
        )}

        {headerContent && <>{headerContent}</>}

        <HStack spacing="0.5rem" flexGrow={2} justify="flex-end">
          {headerRightContent && <>{headerRightContent}</>}

          {canDownload && (
            <Tooltip placement="bottom" label={downloadTooltip} aria-label={downloadTooltip}>
              <Link href={downloadUrl} download>
                <IconButton aria-label={downloadTooltip} size="sm" icon={iconFactoryAs('download')} />
              </Link>
            </Tooltip>
          )}
          {canDisplayRaw && (
            <Tooltip placement="bottom" label="Display source" aria-label="Display source">
              <IconButton
                aria-label="Display source"
                size="sm"
                icon={iconFactoryAs('code')}
                onClick={() => setMode('raw')}
              />
            </Tooltip>
          )}
          {canRender && canDisplayRendered && (
            <Tooltip placement="bottom" label="Display rendered" aria-label="Display rendered">
              <IconButton
                aria-label="Display rendered"
                size="sm"
                icon={iconFactoryAs('preview')}
                onClick={() => setMode('rendered')}
              />
            </Tooltip>
          )}
        </HStack>
      </HStack>

      <Flex
        direction="column"
        flexGrow={1}
        borderColor="gray.300"
        borderWidth="1px"
        backgroundColor="white"
        overflow="hidden"
        {...rendererStyles}
        {...borderlessStyles}
      >
        {renderer}
      </Flex>
    </Flex>
  );
};
