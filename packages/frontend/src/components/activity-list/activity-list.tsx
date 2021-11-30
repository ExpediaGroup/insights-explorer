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

import { Flex, Skeleton, StackDivider, Text, useToast, VStack } from '@chakra-ui/react';
import InfiniteScroll from 'react-infinite-scroller';

import { Alert } from '../../components/alert/alert';
import { ActivityConnection } from '../../models/generated/graphql';
import { useLikedBy } from '../../shared/useLikedBy';
import { ActivityView } from '../activity-view/activity-view';

import { ActivityListSkeleton } from './components/activity-list-skeleton/activity-list-skeleton';

const EdgeContainer = ({ edges, onLike, onFetchLikedBy }) => {
  return (
    <VStack spacing="0.5rem" align="stretch" divider={<StackDivider borderColor="snowstorm.300" />}>
      {edges.map((edge) => (
        <ActivityView key={edge.node.id} activityEdge={edge} onFetchLikedBy={onFetchLikedBy} onLike={onLike} />
      ))}
    </VStack>
  );
};

export interface ActivityListProps {
  activityConnection?: ActivityConnection;
  fetching?: boolean;
  fetchMore?: () => Promise<void>;
  hasMore?: boolean;
  onLikeActivity: any;
  showTotal?: boolean;
  options?: Record<string, any>;
}

export const ActivityList = ({
  activityConnection,
  fetching,
  fetchMore = async () => {
    return;
  },
  hasMore = false,
  onLikeActivity,
  showTotal = true
}: ActivityListProps) => {
  const toast = useToast();

  const { onFetchLikedBy } = useLikedBy('activity');

  const onLike = async (activityId: string, liked: boolean): Promise<boolean> => {
    console.log('Liking activity:', activityId);
    const { error } = await onLikeActivity({
      activityId,
      liked
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to like activity.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
      return false;
    }

    return true;
  };

  if (fetching || activityConnection === undefined) {
    return (
      <>
        {showTotal && <Skeleton mb="0.5rem" width="10rem" height="1.5rem" />}
        <ActivityListSkeleton key="skeleton" count={5} />
      </>
    );
  }

  if (activityConnection.edges.length === 0) {
    return <Alert info={`No Activities found.`} />;
  }

  return (
    <InfiniteScroll pageStart={0} loadMore={fetchMore} hasMore={hasMore} threshold={500}>
      {showTotal && activityConnection.pageInfo?.total && (
        <Flex mb="0.5rem">
          <Text textTransform="uppercase" fontSize="sm" fontWeight="bold" color="polar.600">
            {activityConnection.pageInfo.total} result{activityConnection.pageInfo.total > 1 && 's'}
          </Text>
        </Flex>
      )}
      <EdgeContainer edges={activityConnection.edges} onLike={onLike} onFetchLikedBy={onFetchLikedBy} />
    </InfiniteScroll>
  );
};
