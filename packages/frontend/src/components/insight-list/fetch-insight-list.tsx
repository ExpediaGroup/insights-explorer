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

import { BoxProps, Progress } from '@chakra-ui/react';
import { memo } from 'react';

import { Sort } from '../../models/generated/graphql';
import { useSearch } from '../../shared/useSearch';
import { Alert } from '../alert/alert';

import { InsightList, InsightListProps } from './insight-list';

type Props = Omit<InsightListProps, 'insightConnection'> & { query: string; sort?: Sort };

export const FetchInsightList = memo(({ query, options, sort, ...props }: Props & Omit<BoxProps, 'children'>) => {
  const [{ data, error, fetching, hasMore, total }, fetchMore] = useSearch({
    query,
    sort
  });

  if (fetching) {
    return <Progress size="xs" isIndeterminate />;
  }

  if (error) {
    return <Alert error={error} {...props} />;
  } else {
    return (
      <InsightList
        insightConnection={
          fetching
            ? undefined
            : {
                // Results aren't actually a connection, so re-map it
                edges: data.insights.results.map(({ score, insight }) => ({ score, node: insight })),
                pageInfo: { total }
              }
        }
        fetchMore={fetchMore}
        hasMore={hasMore}
        options={options}
        {...props}
      />
    );
  }
});
