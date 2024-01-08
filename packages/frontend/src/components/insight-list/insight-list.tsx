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

import { Flex, Skeleton, Text, Wrap, WrapItem } from '@chakra-ui/react';
import InfiniteScroll from 'react-infinite-scroller';

import { Alert } from '../../components/alert/alert';
import type { InsightConnection } from '../../models/generated/graphql';
import type { SearchOptions } from '../../store/search.slice';
import { InsightConnectionCard } from '../insight-connection-card/insight-connection-card';

import { InsightListSkeleton } from './components/insight-list-skeleton/insight-list-skeleton';

const EdgeContainer = ({ edges, options }) => {
  switch (options.layout) {
    case 'square': {
      return (
        <Wrap
          spacing="1rem"
          pb="1rem"
          direction={{ base: 'column', sm: 'row' }}
          sx={{
            '> ul': {
              // Disable wrap at small screen sizes
              flexWrap: { base: 'nowrap', sm: 'wrap' }
            }
          }}
        >
          {edges.map((edge) => (
            <WrapItem key={edge.node.id} flexDirection={{ base: 'column', sm: 'row' }}>
              <InsightConnectionCard insightEdge={edge} options={options} />
            </WrapItem>
          ))}
        </Wrap>
      );
    }
    default: {
      const marginBottom = options.layout === 'compact' ? '0.5rem' : '1rem';

      return (
        <Flex flexDirection="column">
          {edges.map((edge) => (
            <InsightConnectionCard key={edge.node.id} insightEdge={edge} options={options} mb={marginBottom} />
          ))}
        </Flex>
      );
    }
  }
};

export interface InsightListProps {
  insightConnection: InsightConnection | undefined;
  fetchMore?: () => Promise<void>;
  hasMore?: boolean;
  options: SearchOptions;
  showTotal?: boolean;
}

export const InsightList = ({
  insightConnection,
  fetchMore = async () => {
    return;
  },
  hasMore = false,
  showTotal = true,
  options
}: InsightListProps) => {
  if (insightConnection === undefined) {
    return (
      <>
        {showTotal && <Skeleton mb="0.5rem" width="10rem" height="1.5rem" />}
        <InsightListSkeleton key="skeleton" count={3} options={options} />
      </>
    );
  }

  if (insightConnection.edges.length === 0) {
    return <Alert info={`No Insights found.`} />;
  }

  return (
    <InfiniteScroll
      pageStart={0}
      loadMore={fetchMore}
      hasMore={hasMore}
      loader={<InsightListSkeleton key="skeleton" count={3} options={options} />}
      threshold={500}
    >
      {showTotal && insightConnection.pageInfo?.total && (
        <Flex mb="0.5rem">
          <Text textTransform="uppercase" fontSize="sm" fontWeight="bold" color="polar.600">
            {insightConnection.pageInfo.total} result{insightConnection.pageInfo.total > 1 && 's'}
          </Text>
        </Flex>
      )}
      <EdgeContainer edges={insightConnection.edges} options={options} />
    </InfiniteScroll>
  );
};
