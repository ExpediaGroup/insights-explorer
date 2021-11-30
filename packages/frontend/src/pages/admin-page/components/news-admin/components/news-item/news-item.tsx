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

import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import { DateTime } from 'luxon';
import { useState } from 'react';

import { Card } from '../../../../../../components/card/card';
import { getCoreProps } from '../../../../../../components/markdown-container/chakra-ui-renderer';
import { MarkdownContainer, Renderers } from '../../../../../../components/markdown-container/markdown-container';
import { NewsFieldsFragment } from '../../../../../../models/generated/graphql';
import { formatDateIntl } from '../../../../../../shared/date-utils';
import { EditNewsItem } from '../edit-news-item/edit-news-item';

const customRenderers = {
  heading: ({ node, children, level, ...props }) => {
    const sizes = ['1.4rem', '1.2rem', '1.1rem', '1rem', '0.8rem', '0.6rem'];
    return (
      <Heading as={`h${level}`} size={sizes[level - 1]} {...getCoreProps(props)}>
        {children}
      </Heading>
    );
  },
  paragraph: ({ node, children, ...props }) => {
    return (
      <Text mb="1rem" fontSize="sm">
        {children}
      </Text>
    );
  }
} as Renderers;

export const NewsItem = ({
  edge,
  isSubmitting,
  onDelete,
  onSubmit
}: {
  edge: { node: NewsFieldsFragment };
  isSubmitting: boolean;
  onDelete?: (NewsFieldsFragment) => Promise<any>;
  onSubmit: (NewsFieldsFragment) => Promise<any>;
}) => {
  const [editing, setEditing] = useState(false);

  return editing ? (
    <EditNewsItem
      edge={edge}
      isSubmitting={isSubmitting}
      onCancel={() => setEditing(false)}
      onDelete={(news) => onDelete && onDelete(news).then(() => setEditing(false))}
      onSubmit={(news) => onSubmit(news).then(() => setEditing(false))}
    />
  ) : (
    <Card key={edge.node.id}>
      <MarkdownContainer contents={edge.node.body} renderers={customRenderers} baseLinkUrl="/" />
      <Flex align="center" justify="space-between">
        <Text fontSize="sm">{formatDateIntl(edge.node.activeAt, DateTime.DATE_MED)}</Text>
        <Button size="sm" width={{ base: '100%', md: 'unset' }} variant="frost" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </Flex>
    </Card>
  );
};
