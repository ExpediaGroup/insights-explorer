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

import { BoxProps, Box } from '@chakra-ui/react';
import isEqual from 'lodash/isEqual';
import { memo, ReactElement, ReactNode, useCallback, useState } from 'react';
import ReactMarkdownWithHtml from 'react-markdown/with-html';
import remarkDirective from 'remark-directive';
import remarkEmoji from 'remark-emoji';
import remarkFootnotes from 'remark-footnotes';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import remarkToc from 'remark-toc';
import urljoin from 'url-join';

import { remarkCodePlus } from '../../shared/remark/remark-code-plus';
import { remarkIex } from '../../shared/remark/remark-iex';
import { remarkIexLogo } from '../../shared/remark/remark-iex-logo';
import { isHashUrl, isRelativeUrl } from '../../shared/url-utils';
import { pick } from '../../shared/utility';

import { ChakraUIRenderer } from './chakra-ui-renderer';

export type Renderers = { [nodeType: string]: (props: any) => ReactElement };

interface Props {
  contents: string;
  baseAssetUrl?: string;
  baseLinkUrl?: string;
  transformAssetUri?: ((uri: string) => string) | null;
  transformLinkUri?: (uri: string, children?: ReactNode, title?: string) => string;
  renderers?: Renderers;
}

function areEqual(prevProps, nextProps): boolean {
  // Only compare a few properties to determine if re-rendering is needed
  // There's no mechanism for most of the other properties to change dynamically.
  const keys = ['contents', 'display'];
  return isEqual(pick(prevProps, keys), pick(nextProps, keys));
}

export const MarkdownContainer = memo(
  ({
    contents,
    baseAssetUrl = window.location.pathname,
    baseLinkUrl = window.location.pathname,
    transformAssetUri,
    transformLinkUri,
    renderers = {},
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

    const defaultTransformLinkUri = useCallback(
      (uri: string) => {
        if (uri !== undefined && isRelativeUrl(uri) && !isHashUrl(uri)) {
          return urljoin(baseLinkUrl, uri);
        }
        return uri;
      },
      [baseLinkUrl]
    );

    const [rendererCache] = useState<Renderers>(
      ChakraUIRenderer(renderers, transformAssetUri ?? defaultTransformAssetUri)
    );

    return (
      <Box {...boxProps} className="iex-markdown-container">
        <ReactMarkdownWithHtml
          children={contents}
          renderers={rendererCache}
          allowDangerousHtml={true}
          plugins={[
            remarkDirective,
            remarkGfm,
            [remarkFootnotes, { inlineNotes: true }],
            remarkEmoji,
            remarkIex,
            remarkIexLogo,
            remarkSlug,
            [remarkToc, { tight: true }],
            [
              remarkCodePlus,
              { baseUrl: baseAssetUrl, transformAssetUri: transformAssetUri ?? defaultTransformAssetUri }
            ]
          ]}
          transformLinkUri={transformLinkUri ?? defaultTransformLinkUri}
          transformImageUri={transformAssetUri ?? defaultTransformAssetUri}
        />
      </Box>
    );
  },
  areEqual
);
