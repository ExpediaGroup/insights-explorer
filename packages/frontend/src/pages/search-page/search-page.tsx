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

import { Box, Stack, VStack } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Alert } from '../../components/alert/alert';
import { InsightList } from '../../components/insight-list/insight-list';
import { generateSearchUrl } from '../../shared/search-url';
import { useDebounce } from '../../shared/useDebounce';
import { useSearch } from '../../shared/useSearch';
import { searchSlice } from '../../store/search.slice';
import type { AppDispatch, RootState } from '../../store/store';

import { FilterSidebar } from './components/filter-sidebar/filter-sidebar';
import { SearchBar } from './components/search-bar/search-bar';

export const SearchPage = () => {
  const initialized = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const { query, useNewSearch, sort, showFilters, options } = useSelector((state: RootState) => state.search);

  // Load query from params
  const { query: queryFromUrl } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [{ data, error, fetching, hasMore, total }, fetchMore] = useSearch({
    query,
    sort,
    paused: !initialized.current,
    useNewSearch
  });

  const insightResults = data.insights.results.map(({ insight }) => {
    return { id: insight.id, name: insight.name, fullName: insight.fullName, itemType: insight.itemType };
  });

  useEffect(() => {
    if (!initialized.current) {
      console.log('Initializing search from URL');
      const simpleSearchParams = Array.from(searchParams).reduce((object, [key, value]) => {
        object[key] = value;
        return object;
      }, {});

      dispatch(
        searchSlice.actions.parseUrlIntoState({
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

    const url = '/search' + generateSearchUrl(query, sort, useNewSearch);
    navigate(url, { replace: true });
  }, [dispatch, navigate, query, useNewSearch, queryFromUrl, searchParams, sort]);

  useDebounce(
    () => {
      dispatch(searchSlice.actions.setSearchResults(insightResults));
    },
    250,
    [insightResults]
  );

  return (
    <>
      <Helmet>
        <title>{query}</title>
      </Helmet>

      <VStack spacing="1rem" pt="1rem" align="stretch">
        {error && <Alert error={error} />}

        <VStack spacing="1rem" align="stretch">
          <SearchBar />

          <Stack spacing="1rem" align="stretch" direction={{ base: 'column-reverse', md: 'row' }}>
            <Box flexGrow={1}>
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
              />
            </Box>

            <FilterSidebar
              suggestedFilters={data.insights.suggestedFilters}
              display={showFilters ? 'block' : 'none'}
              //bgColor="snowstorm.100"
              borderRadius="0.5rem"
              padding="0.5rem"
              flexBasis={{ base: '16rem', md: '20rem', xl: '22rem' }}
              flexShrink={0}
              maxWidth={{ base: 'unset', md: '20rem', xl: '26rem' }}
            />
          </Stack>
        </VStack>
      </VStack>
    </>
  );
};
