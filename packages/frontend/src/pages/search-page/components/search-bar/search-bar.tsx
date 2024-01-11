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

import {
  Box,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Switch,
  Tooltip
} from '@chakra-ui/react';
import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

// import { toggleUseNewSearch } from '../../../../../../backend/src/lib/elasticsearch';
import { iconFactoryAs } from '../../../../shared/icon-factory';
import { useDebounce } from '../../../../shared/useDebounce';
import { searchSlice } from '../../../../store/search.slice';
import type { AppDispatch, RootState } from '../../../../store/store';
import { SearchBox } from '../search-box/search-box';

import { SearchSyntax } from './search-syntax';

const availableSortFields = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Last Updated Date' },
  { value: 'publishedDate', label: 'Published Date' },
  { value: 'name', label: 'Name' },
  { value: 'likeCount', label: 'Likes' },
  { value: 'viewCount', label: 'Views' },
  { value: 'commentCount', label: 'Comments' }
];

export const SearchBar = (): ReactElement => {
  const dispatch = useDispatch<AppDispatch>();
  const { query, useNewSearch, sort, showFilters, isFiltered, options } = useSelector(
    (state: RootState) => state.search
  );

  const [internalQuery, setInternalQuery] = useState(query);

  const previousQueryRef = useRef(query);

  const setUseNewSearch = (value: boolean) => {
    dispatch(searchSlice.actions.setUseNewSearch(value));

    //trigger a new search, how to do this well?
  };

  const toggleShowFilters = () => {
    dispatch(searchSlice.actions.setShowFilters(!showFilters));
  };

  const onSortFieldChange = (field) => {
    dispatch(searchSlice.actions.setSortField(field));
  };

  const onSortDirectionChange = (direction) => {
    dispatch(searchSlice.actions.setSortDirection(direction));
  };

  useEffect(() => {
    setInternalQuery(query);
  }, [query]);

  // Debounce query changes to avoid too-frequent updates
  useDebounce(
    () => {
      if (internalQuery !== previousQueryRef.current && internalQuery !== query) {
        dispatch(searchSlice.actions.setQuery(internalQuery));
        previousQueryRef.current = internalQuery;
      }
    },
    100,
    [internalQuery]
  );

  const onClear = () => {
    setInternalQuery('');
    previousQueryRef.current = '';
    dispatch(searchSlice.actions.clearSearch());
  };

  const onLayoutChange = (layout) => {
    dispatch(searchSlice.actions.mergeOptions({ layout }));
  };

  const optionsArray = Object.entries(options || {})
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  const onOptionsChange = (selectedOptions: string | string[]) => {
    const updatedOptions = { ...options };

    if (selectedOptions instanceof String) {
      selectedOptions = [selectedOptions as string];
    }

    // Disabled menu items are not included in selectedOptions
    // Need to enumerate each expected option from the menu to determine true/false
    updatedOptions.showScores = selectedOptions.includes('showScores');
    updatedOptions.showUpdatedAt = selectedOptions.includes('showUpdatedAt');

    dispatch(searchSlice.actions.mergeOptions(updatedOptions));
  };

  return (
    <HStack spacing="0.5rem">
      <SearchBox
        query={internalQuery}
        onQueryChange={setInternalQuery}
        onClear={onClear}
        canClear={query.length > 0 || sort !== undefined}
      />

      <Tooltip placement="left" label="Use new search" aria-label="Use new search" zIndex="10">
        <Switch
          id="enable-new-search"
          colorScheme="nord8"
          aria-label="Use New Search"
          isChecked={useNewSearch}
          onChange={(event) => setUseNewSearch(event?.target.checked)}
        />
      </Tooltip>

      <SearchSyntax />

      <Menu>
        <Tooltip placement="left" label="Show sort options" aria-label="Show sort options" zIndex="10">
          <MenuButton as={Box} display="inline-block">
            <IconButton
              variant={sort === undefined ? 'ghost' : 'solid'}
              bgColor={sort === undefined ? 'clear' : 'frost.200'}
              aria-label="stupid sort options"
              icon={sort?.direction === 'asc' ? iconFactoryAs('sortUp') : iconFactoryAs('sortDown')}
            />
          </MenuButton>
        </Tooltip>
        <MenuList zIndex={10}>
          <MenuOptionGroup title="Sort By" type="radio" value={sort?.field} onChange={onSortFieldChange}>
            {availableSortFields.map((field) => (
              <MenuItemOption key={field.value} value={field.value}>
                {field.label}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
          <MenuDivider />
          <MenuOptionGroup title="Sort Order" type="radio" value={sort?.direction} onChange={onSortDirectionChange}>
            <MenuItemOption value="asc">Ascending</MenuItemOption>
            <MenuItemOption value="desc">Descending</MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Menu>

      <Tooltip placement="left" label="Show filter options" aria-label="Show filter options" zIndex="10">
        <IconButton
          variant={isFiltered ? 'solid' : 'ghost'}
          bgColor={isFiltered ? 'frost.200' : 'clear'}
          aria-label="Expand filter options"
          icon={iconFactoryAs('filter')}
          onClick={toggleShowFilters}
        />
      </Tooltip>

      <Menu>
        <Tooltip placement="left" label="Show search options" aria-label="Show search options" zIndex="10">
          <MenuButton as={Box} display="inline-block">
            <IconButton variant="ghost" aria-label="Show search options" icon={iconFactoryAs('optionsMenu')} />
          </MenuButton>
        </Tooltip>
        <MenuList zIndex={10}>
          <MenuOptionGroup title="Layout" type="radio" value={options.layout} onChange={onLayoutChange}>
            <MenuItemOption value="default">Default</MenuItemOption>
            <MenuItemOption value="compact">Compact</MenuItemOption>
            <MenuItemOption value="square">Cards</MenuItemOption>
          </MenuOptionGroup>
          <MenuDivider />
          <MenuOptionGroup title="Options" type="checkbox" value={optionsArray} onChange={onOptionsChange}>
            <MenuItemOption value="showUpdatedAt">Show last update</MenuItemOption>
            <MenuItemOption value="showScores">Show scores</MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </HStack>
  );
};
