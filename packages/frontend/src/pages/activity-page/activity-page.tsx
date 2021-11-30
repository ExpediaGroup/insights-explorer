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

import { Box, HStack, VStack } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { ActivityList } from '../../components/activity-list/activity-list';
import { Alert } from '../../components/alert/alert';
import { generateSearchUrl } from '../../shared/search-url';
import { useActivities } from '../../shared/useActivities';
import { activitySlice } from '../../store/activity.slice';
import { RootState } from '../../store/store';

import { ActivityFilterSidebar } from './components/activity-filter-sidebar/activity-filter-sidebar';
import { ActivitySearchBar } from './components/activity-search-bar/activity-search-bar';

export const ActivityPage = () => {
  const initialized = useRef(false);
  const dispatch = useDispatch();
  const { query, sort, showFilters, options } = useSelector((state: RootState) => state.activity);

  // Load query from params
  const { query: queryFromUrl } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [{ data, error, fetching, hasMore }, fetchMore, onLikeActivity] = useActivities({
    query,
    sort,
    paused: !initialized.current
  });

  useEffect(() => {
    if (!initialized.current) {
      console.log('Initializing search from URL');
      const simpleSearchParams = Array.from(searchParams).reduce((object, [key, value]) => {
        object[key] = value;
        return object;
      }, {});

      dispatch(
        activitySlice.actions.parseUrlIntoState({
          query: queryFromUrl,
          searchParams: simpleSearchParams
        })
      );
      initialized.current = true;

      if (queryFromUrl !== undefined || Object.keys(simpleSearchParams).length > 0) {
        // Guaranteed state change, so defer to next redraw
        return;
      }
    }

    const url = '/activities' + generateSearchUrl(query, sort);
    navigate(url, { replace: true });
  }, [dispatch, navigate, query, queryFromUrl, searchParams, sort]);

  return (
    <>
      <Helmet>
        <title>Activities</title>
      </Helmet>

      <VStack spacing="1rem" pt="1rem" align="stretch">
        {error && <Alert error={error} />}

        <VStack spacing="1rem" align="stretch">
          <ActivitySearchBar />

          <HStack spacing="1rem" pt="1rem" align="stretch">
            <Box flexGrow={2}>
              <ActivityList
                activityConnection={data.activityConnection}
                fetching={fetching}
                fetchMore={fetchMore}
                hasMore={hasMore}
                onLikeActivity={onLikeActivity}
                options={options}
              />
            </Box>

            <ActivityFilterSidebar
              suggestedFilters={data.suggestedFilters}
              display={showFilters ? 'block' : 'none'}
              //bgColor="snowstorm.100"
              borderRadius="0.5rem"
              padding="0.5rem"
              flexBasis={{ base: '16rem', md: '20rem', xl: '22rem' }}
              flexShrink={0}
              maxWidth={{ base: '16rem', md: '20rem', xl: '26rem' }}
            />
          </HStack>
        </VStack>
      </VStack>
    </>
  );
};
