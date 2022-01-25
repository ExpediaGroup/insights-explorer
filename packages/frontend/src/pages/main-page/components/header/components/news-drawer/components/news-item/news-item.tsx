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

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { DateTime } from 'luxon';
import { Components } from 'react-markdown';

import { Card } from '../../../../../../../../components/card/card';
import { LikeButton } from '../../../../../../../../components/like-button/like-button';
import { LikedByTooltip } from '../../../../../../../../components/liked-by-tooltip/liked-by-tooltip';
import { getCoreProps } from '../../../../../../../../components/markdown-container/chakra-ui-renderer';
import { MarkdownContainer } from '../../../../../../../../components/markdown-container/markdown-container';
import { News, User } from '../../../../../../../../models/generated/graphql';
import { formatDateIntl } from '../../../../../../../../shared/date-utils';

const heading = ({ node, children, level, ...props }) => {
  const sizes = ['1.4rem', '1.2rem', '1.1rem', '1rem', '0.8rem', '0.6rem'];
  return (
    <Heading as={`h${level}`} size={sizes[level - 1]} {...getCoreProps(props)}>
      {children}
    </Heading>
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
