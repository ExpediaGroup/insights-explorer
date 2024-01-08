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

import {
  Badge,
  Box,
  Checkbox,
  Code,
  Divider,
  Heading,
  Icon,
  Image,
  Input,
  Link as ChakraLink,
  List,
  ListItem,
  Table,
  TableCaption,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react';
import type { Components } from 'react-markdown';
import Zoom from 'react-medium-image-zoom';

import type { Sort } from '../../models/generated/graphql';
import { destringObject } from '../../shared/destring';
import { hashCode } from '../../shared/hash';
import { iconFactory } from '../../shared/icon-factory';
import { getMimeForFileName } from '../../shared/mime-utils';
import { isHashUrl, isRelativeUrl } from '../../shared/url-utils';
import { BlockQuote } from '../blockquote/blockquote';
import { FetchInsightConnectionCard } from '../insight-connection-card/fetch-insight-connection-card';
import { FetchInsightList } from '../insight-list/fetch-insight-list';
import { Link } from '../link/link';
import { CodeRendererAsync as CodeRenderer } from '../renderers/code-renderer/code-renderer-async';
import { FetchCodeRenderer } from '../renderers/code-renderer/fetch-code-renderer';
import { KaTeXRendererAsync } from '../renderers/katex-renderer/katex-renderer-async';
import { VegaRendererAsync } from '../renderers/vega-renderer/vega-renderer-async';
import { VideoRenderer } from '../renderers/video-renderer/video-renderer';
import { XkcdChartRendererAsync } from '../renderers/xkcd-chart-renderer/xkcd-chart-renderer-async';
import { FetchUserTag } from '../user-tag/fetch-user-tag';

import './markdown-container.css';
import 'react-medium-image-zoom/dist/styles.css';

export const getDataAttributes = (props): any => {
  return props['data-sourcepos'] ? { 'data-sourcepos': props['data-sourcepos'] } : {};
};

const heading = ({ node, level, children, ...props }) => {
  const sizes = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const mt = ['2rem', '1.75rem', '1.5rem', '1rem', '1rem', '1rem'];

  return (
    <Heading
      className="heading"
      mb="0.5rem"
      mt={mt[level - 1]}
      as={`h${level}`}
      size={sizes[level - 1]}
      borderBottomWidth={level === 1 ? 1 : 0}
      borderBottomStyle="solid"
      borderBottomColor="snowstorm.100"
      display="flex"
      alignItems="center"
      sx={{
        // Display self-link on hover
        '&:hover': {
          '.heading-auto-link': {
            display: 'block'
          }
        }
      }}
      {...node.properties}
      {...props}
    >
      {children}
    </Heading>
  );
};

const getList = ({ node, children, depth, ordered, start, ...props }) => {
  if (start !== null && start !== 1 && start !== undefined) {
    start = start.toString();
  }
  let styleType = 'disc';
  if (ordered) styleType = 'decimal';
  if (depth === 1) styleType = 'circle';

  return (
    <List as={ordered ? 'ol' : 'ul'} styleType={styleType} ml={depth === 0 ? '1rem' : 0} pl="1rem" mb="1rem" {...props}>
      {children}
    </List>
  );
};

export const ChakraUIRenderer = (
  customRenderers: Components = {},
  transformAssetUri: (uri: string) => string
): Components => {
  const combined: Components = {
    // Standard HTML elements
    h1: heading,
    h2: heading,
    h3: heading,
    h4: heading,
    h5: heading,
    h6: heading,
    p: ({ node, children, ...props }) => {
      return (
        <Text as={Box} mb="1rem" {...props}>
          {children}
        </Text>
      );
    },
    em: ({ node, children, ...props }) => {
      return (
        <Text as="em" {...props}>
          {children}
        </Text>
      );
    },
    span: ({ node, children, ...props }) => {
      // Rehype-autolink-headings
      if (props.className === 'icon icon-link') {
        return (
          <Icon
            className="heading-auto-link"
            display="none"
            as={iconFactory('link')}
            fontSize="80%"
            ml="0.5rem"
            color="frost.400"
            {...getDataAttributes(props)}
          />
        );
      }

      return (
        <Text as="span" {...props}>
          {children}
        </Text>
      );
    },
    strong: ({ node, children, ...props }) => {
      return (
        <Text as="strong" {...props}>
          {children}
        </Text>
      );
    },
    blockquote: ({ node, children, ...props }) => {
      return <BlockQuote {...(props as any)}>{children}</BlockQuote>;
    },
    code: ({ node, inline, className, collapse, value, children, ...props }: any) => {
      const defaultIsOpen = !(collapse === 'true');

      const languageMatch = /language-(\w+)/.exec(className || '');
      const language = languageMatch && languageMatch[1];

      if (inline) {
        return <Code {...props}>{children}</Code>;
      }

      if (props.uri) {
        // Wrap in a component that fetches external file contents before rendering
        // Depends on the remark-code-file plugin to parse the metadata
        return (
          <FetchCodeRenderer
            url={props.uri}
            lines={props.lines}
            language={language || ''}
            copyButton={true}
            defaultIsOpen={defaultIsOpen}
            mb="1rem"
            {...props}
          />
        );
      } else {
        return (
          <CodeRenderer
            contents={String(children || '').replace(/\n$/, '')}
            language={language || ''}
            copyButton={true}
            defaultIsOpen={defaultIsOpen}
            mb="1rem"
            {...props}
          />
        );
      }
    },
    del: ({ node, children, ...props }) => {
      return (
        <Text as="del" {...(props as any)}>
          {children}
        </Text>
      );
    },
    hr: ({ node, children, ...props }) => {
      return <Divider my="0.5rem" {...props} />;
    },
    a: ({ node, ...props }) => {
      if (props.href && isRelativeUrl(props.href) && !isHashUrl(props.href)) {
        return <Link to={props.href} {...props} color="frost.400" />;
      }
      return <ChakraLink as="a" {...props} color="frost.400" />;
    },
    img: ({ node, ...props }) => {
      return (
        <Zoom>
          <Image ignoreFallback {...props} />
        </Zoom>
      );
    },
    text: ({ node, children, ...props }) => {
      return (
        <Text as="span" {...getDataAttributes(props)}>
          {children}
        </Text>
      );
    },
    ol: getList,
    ul: getList,
    li: ({ node, children, checked, ordered, ...props }) => {
      return (
        <ListItem
          {...props}
          listStyleType={checked === null ? 'inherit' : 'none'}
          {...(props.className === 'task-list-item' ? { display: 'flex', align: 'center', ml: '-1rem' } : {})}
        >
          {children}
        </ListItem>
      );
    },
    input: ({ node, children, ...props }) => {
      return props.type === 'checkbox' ? (
        <Checkbox isChecked={props.checked} isReadOnly mr="0.5rem" {...(props as any)} />
      ) : (
        <Input {...(props as any)}>{children}</Input>
      );
    },
    table: ({ node, children, border, caption, width, ...props }: any) => {
      const defaultProps = { variant: 'simple', size: 'sm' };

      return (
        <Box
          width={width || 'fit-content'}
          overflow="auto"
          py="0.5rem"
          mb="1rem"
          {...(border === 'true'
            ? { border: '1px solid', borderRadius: 'lg', borderColor: 'snowstorm.300', p: '1rem' }
            : {})}
        >
          <Table {...defaultProps} {...props}>
            {caption && <TableCaption>{caption}</TableCaption>}
            {children}
          </Table>
        </Box>
      );
    },
    thead: ({ children, ...props }) => {
      return <Thead>{children}</Thead>;
    },
    tbody: ({ children, ...props }) => {
      return <Tbody>{children}</Tbody>;
    },
    tr: ({ children, ...props }) => {
      return <Tr>{children}</Tr>;
    },
    th: ({ node, children, ...props }) => {
      return (
        <Th {...(props as any)} textAlign={props?.style?.textAlign}>
          {children}
        </Th>
      );
    },
    td: ({ node, children, ...props }) => {
      return (
        <Td {...(props as any)} textAlign={props?.style?.textAlign}>
          {children}
        </Td>
      );
    },
    section: ({ node, children, ...props }) => {
      if (props.className === 'footnotes') {
        return (
          <Box {...props} fontSize="smaller" color="polar.300">
            <Divider mt="2rem" mb="1rem" />
            {children.slice(1)}
          </Box>
        );
      }

      return <section {...props}>{children}</section>;
    },

    // Custom directives
    badge: ({ node, children, ...props }) => {
      return <Badge {...props}>{children}</Badge>;
    },
    katex: ({ math, block, ...props }) => {
      return (
        <Zoom>
          <KaTeXRendererAsync math={math} block={block} />
        </Zoom>
      );
    },
    insight: ({ node, children, ...props }) => {
      return (
        <FetchInsightConnectionCard
          fullName={props.fullName}
          options={{ ...destringObject(props), dispatchSearch: false }}
          mb="1rem"
          {...props}
        />
      );
    },
    insights: ({ node, query, sortDirection, sortField, ...props }) => {
      const direction = sortDirection?.toLowerCase();

      const sort: Sort = {
        field: sortField
      };

      if (direction?.match(/(asc|desc)/)) {
        sort.direction = direction;
      }

      return (
        <FetchInsightList
          query={query}
          sort={sort}
          options={{ ...destringObject(props), dispatchSearch: false }}
          mb="1rem"
          {...props}
        />
      );
    },
    user: ({ node, username, ...props }) => {
      return <FetchUserTag userName={username} />;
    },
    vegachart: ({ node, config, ...props }) => {
      // TODO: Zoom doesn't work with Vega Charts
      return (
        <VegaRendererAsync
          key={hashCode(config)}
          specString={config}
          transformAssetUri={transformAssetUri}
          {...props}
        />
      );
    },
    video: ({ node, children, src, ...props }) => {
      return (
        <VideoRenderer
          url={src}
          mimeType={getMimeForFileName(src)}
          transformAssetUri={transformAssetUri}
          {...destringObject(props)}
        />
      );
    },
    xkcdchart: ({ node, xkcdType, config, ...props }) => {
      return <XkcdChartRendererAsync key={hashCode(config)} type={xkcdType} configString={config} {...props} />;
    },

    // Fallbacks for unrecognized directives
    textdirective: ({ node, children, ...props }) => {
      // Unrecognized text directive
      return (
        <Text as="span" {...props}>
          :{props.name}
        </Text>
      );
    },
    leafdirective: ({ node, children, ...props }) => {
      // Unrecognized leaf directive
      return (
        <Text as="span" {...props}>
          ::{props.name}
        </Text>
      );
    },
    containerdirective: ({ node, children, ...props }) => {
      // Unrecognized container directive
      return (
        <Text as="span" {...props}>
          :::{props.name}
        </Text>
      );
    },

    ...customRenderers
  } as Components;

  return combined;
};
