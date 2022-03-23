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
import { memo } from 'react';

import type { Sort } from '../../models/generated/graphql';
import { useActivities } from '../../shared/useActivities';
import { Alert } from '../alert/alert';

import type { ActivityListProps } from './activity-list';
import { ActivityList } from './activity-list';

type Props = Omit<ActivityListProps, 'activityConnection' | 'onLikeActivity'> & {
  query?: string;
  sort?: Sort;
};

export const FetchActivityList = memo(({ query, sort, ...props }: Props & Omit<BoxProps, 'children'>) => {
  const [{ data, error, fetching, hasMore }, fetchMore, onLikeActivity] = useActivities({
    query,
    sort
  });

  if (error) {
    return <Alert error={error} {...props} />;
  } else {
    return (
      <ActivityList
        activityConnection={fetching ? undefined : data.activityConnection}
        fetching={fetching}
        fetchMore={fetchMore}
        hasMore={hasMore}
        onLikeActivity={onLikeActivity}
        {...props}
      />
    );
  }
});
