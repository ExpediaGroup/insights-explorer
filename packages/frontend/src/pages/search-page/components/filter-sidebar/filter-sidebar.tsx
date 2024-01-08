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
import { StackDivider, VStack } from '@chakra-ui/react';
import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { gql, useQuery } from 'urql';

import type { AutocompleteFilterSidebarQuery, AutocompleteResults } from '../../../../models/generated/graphql';
import type { SearchClause } from '../../../../shared/search';
import {
  parseSearchQuery,
  SearchCompoundRange,
  SearchMultiTerm,
  SearchRange,
  SearchTerm,
  toSearchQuery
} from '../../../../shared/search';
import { searchSlice } from '../../../../store/search.slice';
import type { AppDispatch, RootState } from '../../../../store/store';

import { DateStack } from './components/date-stack/date-stack';
import { FilterStack } from './components/filter-stack/filter-stack';
import { ItemTypeStack } from './components/item-type-stack/item-type-stack';

const AUTOCOMPLETE_QUERY = gql`
  query AutocompleteFilterSidebar {
    autocomplete {
      tags {
        value
        occurrences
      }
      authors {
        value
        label
        occurrences
      }
      teams {
        value
        occurrences
      }
    }
  }
`;

const SidebarDivider = () => <StackDivider borderColor="snowstorm.100" borderTopWidth="1px" />;

interface Props {
  suggestedFilters?: AutocompleteResults;
}

export const FilterSidebar = ({ suggestedFilters, ...boxProps }: Props & BoxProps): ReactElement => {
  const dispatch = useDispatch<AppDispatch>();
  const { query, isFiltered } = useSelector((state: RootState) => state.search);

  const [searchClauses, setSearchClauses] = useState<SearchClause[]>([]);
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);

  const previousQueryRef = useRef('');

  // Load autocomplete values to populate filters
  const [{ data: autocompleteData }] = useQuery<AutocompleteFilterSidebarQuery>({
    query: AUTOCOMPLETE_QUERY
  });

  const autocomplete = autocompleteData?.autocomplete;

  useEffect(() => {
    if (query !== previousQueryRef.current) {
      try {
        const clauses = parseSearchQuery(query);
        setSearchClauses(clauses);

        // Filters
        const searchTerms = clauses.filter(
          (clause) => clause instanceof SearchTerm && clause.value !== ''
        ) as SearchTerm[];
        setSearchTerms(searchTerms);

        // Indicate whether any search terms were parsed
        const isActuallyFiltered = searchTerms.length > 0;
        if (isActuallyFiltered !== isFiltered) {
          dispatch(searchSlice.actions.setIsFiltered(isActuallyFiltered));
        }
      } catch {
        // If there's a parsing error, it will be detected
        // server-side and displayed elsewhere.
        // Do nothing.
      }

      previousQueryRef.current = query;
    }
  }, [dispatch, isFiltered, query]);

  const filterExists = (key: string, value: string): boolean => {
    const filter = new SearchTerm(key, value).toString();

    const existing = searchTerms.find((clause) => {
      return clause.toString() === filter;
    });

    return existing !== undefined;
  };

  const addFilter = (key: string, value: string) => {
    if (filterExists(key, value)) {
      // Avoid duplicates
      return;
    }

    const term = new SearchTerm(key, value);
    dispatch(searchSlice.actions.setQuery(`${query} ${term.toString()}`.trim()));
  };

  const removeFilter = (searchTerm: SearchTerm) => {
    const remaining = searchClauses.filter((clause) => {
      return clause !== searchTerm;
    });

    dispatch(searchSlice.actions.setQuery(toSearchQuery(remaining)));
  };

  const removeRange = (key: string) => {
    const remaining = searchClauses.filter((clause) => {
      return !((clause instanceof SearchRange || clause instanceof SearchCompoundRange) && clause.key === key);
    });

    dispatch(searchSlice.actions.setQuery(toSearchQuery(remaining)));
  };

  const setRange = (key: string, start: any, end: any) => {
    const existing = searchClauses.find((clause) => {
      return clause instanceof SearchCompoundRange && clause.key === key;
    });

    if (existing) {
      // If there are multiple ranges in the query, it will just update the first one
      // This only happens if the user manually adds it to the query
      const existingRange = existing as SearchCompoundRange;
      existingRange.from = start;
      existingRange.to = end;

      dispatch(searchSlice.actions.setQuery(toSearchQuery(searchClauses)));
    } else {
      const range = new SearchCompoundRange(key, start, end);
      dispatch(searchSlice.actions.setQuery(`${query} ${range.toString()}`.trim()));
    }
  };

  const removeTerm = (key: string) => {
    const remaining = searchClauses.filter((clause) => {
      return !((clause instanceof SearchTerm || clause instanceof SearchMultiTerm) && clause.key === key);
    });

    dispatch(searchSlice.actions.setQuery(toSearchQuery(remaining)));
  };

  const setTerms = (key: string, values: string[]) => {
    if (values.length === 0) {
      removeTerm(key);
      return;
    }

    const existingIndex = searchClauses.findIndex((clause) => {
      return (clause instanceof SearchTerm || clause instanceof SearchMultiTerm) && clause.key === key;
    });

    if (existingIndex > -1) {
      searchClauses[existingIndex] =
        values.length === 1 ? new SearchTerm(key, values[0]) : new SearchMultiTerm(key, values);

      dispatch(searchSlice.actions.setQuery(toSearchQuery(searchClauses)));
    } else {
      const newClause: SearchClause =
        values.length === 1 ? new SearchTerm(key, values[0]) : new SearchMultiTerm(key, values);

      dispatch(searchSlice.actions.setQuery(`${query} ${newClause.toString()}`.trim()));
    }
  };

  return (
    <VStack p="0.5rem" spacing="1rem" align="stretch" {...boxProps}>
      <FilterStack
        heading="Tags"
        filterKey="tag"
        searchTerms={searchTerms}
        suggestedFilters={suggestedFilters?.tags || []}
        allFilters={autocomplete?.tags || []}
        filterExists={filterExists}
        addFilter={addFilter}
        removeFilter={removeFilter}
      />
      <SidebarDivider />
      <FilterStack
        heading="Authors"
        filterKey="author"
        searchTerms={searchTerms}
        suggestedFilters={suggestedFilters?.authors || []}
        allFilters={autocomplete?.authors || []}
        filterExists={filterExists}
        addFilter={addFilter}
        removeFilter={removeFilter}
      />
      <SidebarDivider />
      <FilterStack
        heading="Team"
        filterKey="team"
        searchTerms={searchTerms}
        suggestedFilters={suggestedFilters?.teams || []}
        allFilters={autocomplete?.teams || []}
        filterExists={filterExists}
        addFilter={addFilter}
        removeFilter={removeFilter}
      />
      <SidebarDivider />
      <DateStack
        heading="Published Date"
        filterKey="publishedDate"
        searchClauses={searchClauses}
        setRange={setRange}
        removeRange={removeRange}
      />
      <DateStack
        heading="Updated Date"
        filterKey="updatedDate"
        searchClauses={searchClauses}
        setRange={setRange}
        removeRange={removeRange}
      />
      <DateStack
        heading="Created Date"
        filterKey="createdDate"
        searchClauses={searchClauses}
        setRange={setRange}
        removeRange={removeRange}
      />
      <SidebarDivider />
      <ItemTypeStack searchClauses={searchClauses} setTerms={setTerms} />
    </VStack>
  );
};
