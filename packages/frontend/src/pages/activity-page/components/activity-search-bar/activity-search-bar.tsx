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
  Tooltip
} from '@chakra-ui/react';
import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import { iconFactoryAs } from '../../../../shared/icon-factory';
import { useDebounce } from '../../../../shared/useDebounce';
import { activitySlice } from '../../../../store/activity.slice';
import type { AppDispatch, RootState } from '../../../../store/store';
import { ActivitySearchBox } from '../activity-search-box/activity-search-box';

import { ActivitySearchSyntax } from './activity-search-syntax';

const availableSortFields = [
  { value: 'occurredAt', label: 'Activity Date' },
  { value: 'relevance', label: 'Relevance' }
];

export const ActivitySearchBar = (): ReactElement => {
  const dispatch = useDispatch<AppDispatch>();

  const { query, sort, showFilters, isFiltered, options } = useSelector((state: RootState) => state.activity);

  const [internalQuery, setInternalQuery] = useState(query);
  const previousQueryRef = useRef(query);

  const toggleShowFilters = () => {
    dispatch(activitySlice.actions.setShowFilters(!showFilters));
  };

  const onSortFieldChange = (field) => {
    dispatch(activitySlice.actions.setSortField(field));
  };

  const onSortDirectionChange = (direction) => {
    dispatch(activitySlice.actions.setSortDirection(direction));
  };

  useEffect(() => {
    setInternalQuery(query);
  }, [query]);

  // Debounce query changes to avoid too-frequent updates
  useDebounce(
    () => {
      if (internalQuery !== previousQueryRef.current && internalQuery !== query) {
        dispatch(activitySlice.actions.setQuery(internalQuery));
        previousQueryRef.current = internalQuery;
      }
    },
    250,
    [internalQuery]
  );

  const onClear = () => {
    setInternalQuery('');
    previousQueryRef.current = '';
    dispatch(activitySlice.actions.clearSearch());
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

    dispatch(activitySlice.actions.mergeOptions(updatedOptions));
  };

  return (
    <HStack spacing="0.5rem">
      <ActivitySearchBox
        query={internalQuery}
        onQueryChange={setInternalQuery}
        onClear={onClear}
        canClear={query.length > 0 || sort !== undefined}
      />

      <ActivitySearchSyntax />

      <Menu>
        <Tooltip placement="left" label="Show sort options" aria-label="Show sort options" zIndex="10">
          <MenuButton as={Box} display="inline-block">
            <IconButton
              variant={sort === undefined ? 'ghost' : 'solid'}
              bgColor={sort === undefined ? 'clear' : 'frost.200'}
              aria-label="Show sort options"
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
          <MenuOptionGroup title="Options" type="checkbox" value={optionsArray} onChange={onOptionsChange}>
            <MenuItemOption value="showScores">Show scores</MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </HStack>
  );
};
