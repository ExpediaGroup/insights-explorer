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

import { Box, Flex, Heading, List, ListItem, Text } from '@chakra-ui/react';
import { DateTime } from 'luxon';
import type { Components } from 'react-markdown';

import { Card } from '../../../../../../../../components/card/card';
import { LikeButton } from '../../../../../../../../components/like-button/like-button';
import { LikedByTooltip } from '../../../../../../../../components/liked-by-tooltip/liked-by-tooltip';
import { getDataAttributes } from '../../../../../../../../components/markdown-container/chakra-ui-renderer';
import { MarkdownContainer } from '../../../../../../../../components/markdown-container/markdown-container';
import type { News, User } from '../../../../../../../../models/generated/graphql';
import { formatDateIntl } from '../../../../../../../../shared/date-utils';

const heading = ({ node, children, level, ...props }) => {
  const sizes = ['1.4rem', '1.2rem', '1.1rem', '1rem', '0.8rem', '0.6rem'];
  return (
    <Heading as={`h${level}`} size={sizes[level - 1]} {...getDataAttributes(props)}>
      {children}
    </Heading>
  );
};

const getList = ({ node, children, depth, ordered, ...props }) => {
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
      fontSize="sm"
    >
      {children}
    </List>
  );
};

const customComponents: Components = {
  h1: heading,
  h2: heading,
  h3: heading,
  h4: heading,
  h5: heading,
  h6: heading,
  p: ({ node, children, ...props }) => {
    return (
      <Text as={Box} mb="1rem" fontSize="sm">
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
        fontSize="sm"
        listStyleType={checked === null ? 'inherit' : 'none'}
        {...(props.className === 'task-list-item' ? { display: 'flex', align: 'center', ml: '-1rem' } : {})}
      >
        {children}
      </ListItem>
    );
  }
};

export interface Props {
  news: News;
  onFetchLikedBy: (newsId: string) => Promise<User[]>;
  onLike: (newsId: string, liked: boolean) => Promise<boolean>;
}

export const NewsItem = ({ news, onFetchLikedBy, onLike }: Props) => {
  const likeLabel = `${news.viewerHasLiked ? 'Unlike' : 'Like'} this news`;

  return (
    <Card>
      <MarkdownContainer contents={news.body} components={customComponents} baseLinkUrl="/" />
      <Text fontSize="xs">{formatDateIntl(news.activeAt, DateTime.DATE_MED)}</Text>
      <Flex>
        <LikedByTooltip
          label={likeLabel}
          likeCount={news.likeCount}
          onFetchLikedBy={() => onFetchLikedBy(news.id)}
          placement="bottom"
        >
          <LikeButton
            label={likeLabel}
            liked={news.viewerHasLiked}
            likeCount={news.likeCount}
            onLike={(liked: boolean) => onLike(news.id, liked)}
            size="xs"
          />
        </LikedByTooltip>
      </Flex>
    </Card>
  );
};
