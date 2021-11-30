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
  Image,
  Link as ChakraLink,
  List,
  ListItem,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react';
import { ReactFragment } from 'react';

import { Sort } from '../../models/generated/graphql';
import { getMimeForFileName } from '../../shared/mime-utils';
import { isHashUrl, isRelativeUrl } from '../../shared/url-utils';
import { BlockQuote } from '../blockquote/blockquote';
import { FetchInsightConnectionCard } from '../insight-connection-card/fetch-insight-connection-card';
import { FetchInsightList } from '../insight-list/fetch-insight-list';
import { Link } from '../link/link';
import { CodeRenderer } from '../renderers/code-renderer/code-renderer';
import { FetchCodeRenderer } from '../renderers/code-renderer/fetch-code-renderer';
import { KaTeXRendererAsync } from '../renderers/katex-renderer/katex-renderer-async';
import { VegaRendererAsync } from '../renderers/vega-renderer/vega-renderer-async';
import { VideoRenderer } from '../renderers/video-renderer/video-renderer';
import { XkcdChartRendererAsync } from '../renderers/xkcd-chart-renderer/xkcd-chart-renderer-async';

import { Renderers } from './markdown-container';

import './markdown-container.css';

export const getCoreProps = (props): any => {
  return props['data-sourcepos'] ? { 'data-sourcepos': props['data-sourcepos'] } : {};
};

const getHProperties = (data): any => {
  if (data.hProperties != null) {
    return data.hProperties;
  }
};

export const ChakraUIRenderer = (customRenderers: Renderers = {}, transformAssetUri): Renderers => {
  const combined: Renderers = {
    heading: ({ node, level, children, ...props }) => {
      const sizes = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
      const mt = ['2rem', '1.75rem', '1.5rem', '1rem', '1rem', '1rem'];
      return (
        <Heading
          mb="0.5rem"
          mt={mt[level - 1]}
          as={`h${level}`}
          size={sizes[level - 1]}
          borderBottomWidth={level === 1 ? 1 : 0}
          borderBottomStyle="solid"
          borderBottomColor="snowstorm.100"
          {...getCoreProps(props)}
          {...getHProperties(node.data)}
        >
          {children}
        </Heading>
      );
    },
    paragraph: ({ node, children, ...props }) => {
      return (
        <Text as={Box} mb="1rem">
          {children}
        </Text>
      );
    },
    emphasis: ({ node, children, ...props }) => {
      return <Text as="em">{children}</Text>;
    },
    blockquote: ({ node, children, ...props }) => {
      return <BlockQuote>{children}</BlockQuote>;
    },
    code: ({ node, language, value, ...props }) => {
      const defaultIsOpen = !(node.collapse === true);

      if (node.uri) {
        // Wrap in a component that fetches external file contents before rendering
        // Depends on the remark-code-file plugin to parse the metadata
        return (
          <FetchCodeRenderer
            url={node.uri}
            lines={node.lines}
            language={language || ''}
            copyButton={true}
            defaultIsOpen={defaultIsOpen}
            mb="1rem"
          />
        );
      } else {
        return (
          <CodeRenderer
            contents={value || ''}
            language={language || ''}
            copyButton={true}
            defaultIsOpen={defaultIsOpen}
            mb="1rem"
          />
        );
      }
    },
    definition: () => <Text />,
    delete: ({ node, children, ...props }) => {
      return <Text as="del">{children}</Text>;
    },
    inlineCode: ({ node, children, ...props }) => {
      return <Code {...getCoreProps(props)}>{children}</Code>;
    },
    thematicBreak: () => {
      return <Divider my="0.5rem" />;
    },
    link: ({ node, ...props }) => {
      if (isRelativeUrl(props.href) && !isHashUrl(props.href)) {
        return <Link to={props.href} {...props} color="frost.400" />;
      }
      return <ChakraLink as="a" {...props} color="frost.400" />;
    },
    linkReference: ({ node, ...props }) => {
      return <ChakraLink as="a" {...props} color="frost.400" />;
    },
    image: ({ node, ...props }) => {
      return <Image ignoreFallback {...props} {...node.attributes} />;
    },
    imageReference: ({ node, ...props }) => {
      // console.log('imageReference', node, props);
      return <Image ignoreFallback {...props} />;
    },
    text: ({ node, children, ...props }) => {
      return <Text as="span">{children}</Text>;
    },
    list: ({ node, ...props }) => {
      const { start, ordered, children, depth } = props;
      const attrs = getCoreProps(props);
      if (start !== null && start !== 1 && start !== undefined) {
        attrs.start = start.toString();
      }
      let styleType = 'disc';
      if (ordered) styleType = 'decimal';
      if (depth === 1) styleType = 'circle';
      return (
        <List
          as={ordered ? 'ol' : 'ul'}
          styleType={styleType}
          ml={depth === 0 ? '1rem' : 0}
          pl="1rem"
          mb="1rem"
          {...attrs}
        >
          {children}
        </List>
      );
    },
    listItem: ({ node, children, checked, ...props }) => {
      let checkbox: ReactFragment | null = null;
      if (checked !== null && checked !== undefined) {
        checkbox = (
          <Checkbox isChecked={checked} isReadOnly>
            {children}
          </Checkbox>
        );
      }
      return (
        <ListItem {...getCoreProps(props)} listStyleType={checked !== null ? 'none' : 'inherit'}>
          {checkbox || children}
        </ListItem>
      );
    },
    inlineMath: ({ value }) => {
      return <KaTeXRendererAsync math={value} />;
    },
    math: ({ value }) => <KaTeXRendererAsync math={value} block />,
    textDirective: ({ node, children, ...props }) => {
      // Unrecognized text directive
      return <Text as="span">:{props.name}</Text>;
    },
    leafDirective: ({ node, children, ...props }) => {
      // Unrecognized leaf directive
      return <Text as="span">::{props.name}</Text>;
    },
    containerDirective: ({ node, children, ...props }) => {
      // Unrecognized container directive
      return <Text as="span">:::{props.name}</Text>;
    },
    badge: ({ node, children, attributes, ...props }) => {
      return <Badge {...attributes}>{children}</Badge>;
    },
    insight: ({ node, ...props }) => {
      return (
        <FetchInsightConnectionCard
          fullName={props.fullName}
          options={{ ...props.attributes, dispatchSearch: false }}
          mb="1rem"
        />
      );
    },
    insights: ({ node, attributes, ...props }) => {
      const direction = attributes.sortDirection?.toLowerCase();

      const sort: Sort = {
        field: attributes.sortField
      };

      if (direction?.match(/(asc|desc)/)) {
        sort.direction = direction;
      }

      return (
        <FetchInsightList
          query={props.query}
          sort={sort}
          options={{ ...attributes, dispatchSearch: false }}
          mb="1rem"
        />
      );
    },
    vegaChart: ({ node, attributes }) => {
      return <VegaRendererAsync specString={node.config} transformAssetUri={transformAssetUri} {...attributes} />;
    },
    video: ({ node, ...props }) => {
      return (
        <VideoRenderer
          url={props.url}
          mimeType={getMimeForFileName(props.url)}
          transformAssetUri={transformAssetUri}
          {...node.attributes}
        />
      );
    },
    xkcdChart: ({ node, attributes }) => {
      return <XkcdChartRendererAsync type={node.xkcdType} configString={node.config} {...attributes} />;
    },
    footnoteReference: ({ node, ...props }) => {
      return (
        <Text as="sup" id={'reference-' + props.identifier}>
          <ChakraLink href={'#footnote-' + props.identifier} fontWeight="500" color="frost.400">
            [{props.label}]
          </ChakraLink>
        </Text>
      );
    },
    footnoteDefinition: ({ node, children, ...props }) => {
      return (
        <Box pl="1.25rem" fontSize="sm">
          <ChakraLink
            id={'footnote-' + props.identifier}
            href={'#reference-' + props.identifier}
            fontWeight="500"
            color="frost.400"
          >
            {props.label}
          </ChakraLink>
          :{' '}
          <Box color="polar.500" display={children.length > 1 ? '' : 'inline-block'}>
            {children}
          </Box>
        </Box>
      );
    },
    customTable: ({ node, children }) => {
      return (
        <Box
          className={!node.border || node.border === 'border' ? 'table-wrapper' : ''}
          width={node.width || 'fit-content'}
        >
          {children}
        </Box>
      );
    },
    table: ({ node, children }) => {
      const attributes = node.attributes || { variant: 'striped', width: 'fit-content', size: 'sm' };
      return (
        <Box overflow="auto">
          <Table {...attributes}>{children}</Table>
        </Box>
      );
    },
    tableHead: ({ node, children }) => {
      return <Thead>{children}</Thead>;
    },
    tableBody: ({ node, children }) => {
      return <Tbody>{children}</Tbody>;
    },
    tableRow: ({ node, children, columnAlignment }) => {
      return <Tr>{children}</Tr>;
    },
    tableCell: ({ node, children, isHeader, align }) => {
      if (isHeader) {
        return <Th textAlign={align}>{children}</Th>;
      }
      return <Td textAlign={align}>{children}</Td>;
    },
    ...customRenderers
  };

  return combined;
};
