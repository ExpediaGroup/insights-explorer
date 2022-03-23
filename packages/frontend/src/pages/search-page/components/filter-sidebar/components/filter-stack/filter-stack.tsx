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

import { Checkbox } from '@chakra-ui/react';
import CreatableSelect from 'react-select/creatable';

import { SidebarStack } from '../../../../../../components/sidebar-stack/sidebar-stack';
import type { UniqueValue } from '../../../../../../models/generated/graphql';
import type { SearchTerm } from '../../../../../../shared/search';

interface Props {
  filterKey: string;
  heading: string;
  showAllFilters?: boolean;
  allFilters: UniqueValue[];
  suggestedFilters?: UniqueValue[];
  searchTerms: SearchTerm[];
  filterExists: (key: string, value: string) => boolean;
  addFilter: any;
  removeFilter: any;
}

/**
 * Generic filter component that displays:
 *   - selected filters
 *   - suggested filters
 *   - dropdown with all filters
 *
 * Adding/removing filters is handled through callbacks.
 */
export const FilterStack = ({
  filterKey,
  heading,
  searchTerms,
  suggestedFilters,
  allFilters,
  showAllFilters = false,
  filterExists,
  addFilter,
  removeFilter
}: Props) => {
  const selectOptions = allFilters
    .filter((filter) => !filterExists(filterKey, filter.value))
    .map((filter) => {
      return { label: filter.value, value: filter.value };
    });

  const getLabel = (item: { value: string; label?: string }): string => {
    if (item.label) {
      return item.label;
    }
    // const filter = allFilters.find((f) => f.value === item.value);
    // if (filter && filter.label) {
    //   return filter.label;
    // }
    return item.value;
  };

  return (
    <SidebarStack heading={heading}>
      {searchTerms
        .filter((searchTerm) => searchTerm.key === filterKey)
        .map((searchTerm) => {
          return (
            <Checkbox key={searchTerm.value} defaultIsChecked onChange={() => removeFilter(searchTerm)}>
              {getLabel(searchTerm)}
            </Checkbox>
          );
        })}
      {(showAllFilters ? allFilters : suggestedFilters ?? [])
        .slice(0, 4)
        .filter((suggested) => !filterExists(filterKey, suggested.value))
        .map((suggested) => {
          return (
            <Checkbox key={suggested.value} onChange={() => addFilter(filterKey, suggested.value)}>
              {getLabel(suggested)}
            </Checkbox>
          );
        })}
      {!showAllFilters && (
        <CreatableSelect
          name="tags"
          value=""
          options={selectOptions}
          onChange={(e) => addFilter(filterKey, e.value)}
          placeholder={`Select ${filterKey}...`}
          aria-label={`Select ${filterKey}...`}
          formatCreateLabel={(input) => getLabel(input)}
        />
      )}
    </SidebarStack>
  );
};
