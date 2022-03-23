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
import { Alert as ChakraAlert, AlertIcon, Box, Button, Flex, Text } from '@chakra-ui/react';
import isEqual from 'lodash/isEqual';
import type { ReactElement } from 'react';
import { memo, useCallback, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import type { TransformLink } from 'react-markdown/lib/ast-to-react';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkDirective from 'remark-directive';
import remarkEmoji from 'remark-emoji';
import remarkGfm from 'remark-gfm';
import remarkToc from 'remark-toc';

import { remarkCodePlus } from '../../shared/remark/remark-code-plus';
import { remarkIex } from '../../shared/remark/remark-iex';
import { remarkIexLogo } from '../../shared/remark/remark-iex-logo';
import { remarkMentions } from '../../shared/remark/remark-mentions';
import { isHashUrl, isRelativeUrl, urljoin } from '../../shared/url-utils';
import { pick } from '../../shared/utility';

import { ChakraUIRenderer } from './chakra-ui-renderer';
import { IexMarkdownSchema } from './iex-markdown-schema';

interface Props {
  contents: string;
  baseAssetUrl?: string;
  baseLinkUrl?: string;
  transformAssetUri?: ((uri: string) => string) | null;
  transformLinkUri?: TransformLink;
  components?: Components;
}

function areEqual(prevProps, nextProps): boolean {
  // Only compare a few properties to determine if re-rendering is needed
  // There's no mechanism for most of the other properties to change dynamically.
  const keys = ['contents', 'display'];
  return isEqual(pick(prevProps, keys), pick(nextProps, keys));
}

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <ChakraAlert status="error" borderRadius="0.25rem" mb="1rem" alignItems="center" wordBreak="break-word">
      <AlertIcon flexShrink={0} />
      <Flex wordBreak="break-word" flexGrow={2} align="center">
        <Text as="strong" mr="0.5rem" flexShrink={0}>
          Error:
        </Text>
        {`Error rendering Markdown: ${error}`}
      </Flex>
      {resetErrorBoundary && (
        <Button size="sm" bg="snowstorm.100" flexShrink={0} onClick={resetErrorBoundary}>
          Recheck
        </Button>
      )}
    </ChakraAlert>
  );
};

export const MarkdownContainer = memo(
  ({
    contents,
    baseAssetUrl = window.location.pathname,
    baseLinkUrl = window.location.pathname,
    transformAssetUri,
    transformLinkUri,
    components = {},
    ...boxProps
  }: Props & BoxProps): ReactElement => {
    // TODO: Make configurable for draft attachments
    const defaultTransformAssetUri = useCallback(
      (uri: string) => {
        if (uri !== undefined && isRelativeUrl(uri)) {
          // Relative Image URIs are absolute from the baseUrl
          return urljoin(baseAssetUrl, uri);
        }
        return uri;
      },
      [baseAssetUrl]
    );

    const defaultTransformLinkUri: TransformLink = useCallback(
      (uri: string) => {
        if (uri !== undefined && isRelativeUrl(uri) && !isHashUrl(uri)) {
          return urljoin(baseLinkUrl, uri);
        }
        return uri;
      },
      [baseLinkUrl]
    );

    const [componentsCache] = useState<Components>(
      ChakraUIRenderer(components, transformAssetUri ?? defaultTransformAssetUri)
    );

    return (
      <Box {...boxProps}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ReactMarkdown
            children={contents}
            components={componentsCache}
            remarkPlugins={[
              remarkDirective,
              remarkGfm,
              remarkEmoji,
              remarkIex,
              remarkIexLogo,
              [remarkToc, { tight: true }],
              [
                remarkCodePlus,
                { baseUrl: baseAssetUrl, transformAssetUri: transformAssetUri ?? defaultTransformAssetUri }
              ],
              remarkMentions
            ]}
            rehypePlugins={[
              rehypeRaw,
              rehypeSlug,
              [
                rehypeAutolinkHeadings,
                {
                  behavior: 'append'
                }
              ],
              [rehypeSanitize, IexMarkdownSchema]
            ]}
            transformLinkUri={transformLinkUri ?? defaultTransformLinkUri}
            transformImageUri={transformAssetUri ?? defaultTransformAssetUri}
            sourcePos={true}
          />
        </ErrorBoundary>
      </Box>
    );
  },
  areEqual
);
