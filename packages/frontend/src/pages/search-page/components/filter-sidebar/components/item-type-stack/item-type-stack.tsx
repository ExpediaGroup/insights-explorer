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

import { SidebarStack } from '../../../../../../components/sidebar-stack/sidebar-stack';
import { SearchClause, SearchMultiTerm, SearchTerm } from '../../../../../../shared/search';

const itemTypes = [
  { value: 'insight', label: 'Insight' },
  { value: 'page', label: 'Page' },
  { value: 'template', label: 'Template' }
];

const getItemTypes = (searchClauses: SearchClause[]) => {
  const selected = itemTypes.reduce((acc, i) => {
    acc[i.value] = false;
    return acc;
  }, {});

  // Terms like `itemType:insight`
  searchClauses
    .filter((clause): clause is SearchTerm => clause instanceof SearchTerm && clause.key === 'itemType')
    .forEach((term: SearchTerm) => {
      selected[term.value] = true;
    });

  // Multi terms like `itemType:{insight,page}`
  searchClauses
    .filter((clause): clause is SearchMultiTerm => clause instanceof SearchMultiTerm && clause.key === 'itemType')
    .forEach((term: SearchMultiTerm) => {
      term.values.forEach((v) => (selected[v] = true));
    });

  if (Object.values(selected).every((s) => !s)) {
    // Nothing selected: provide a default
    selected['insight'] = true;
    selected['page'] = true;
  }

  return selected;
};

interface Props {
  searchClauses: SearchClause[];
  setTerms: any;
}

export const ItemTypeStack = ({ searchClauses, setTerms }: Props) => {
  const selectedItemTypes = getItemTypes(searchClauses);

  const onChange = (itemType: string, selected: boolean) => {
    selectedItemTypes[itemType] = selected;
    const values = Object.entries(selectedItemTypes)
      .filter(([itemType, value]) => value === true)
      .map(([itemType]) => itemType);

    setTerms('itemType', values);
  };

  return (
    <SidebarStack heading="Item Type">
      {itemTypes.map((itemType) => {
        return (
          <Checkbox
            key={itemType.value}
            isChecked={selectedItemTypes[itemType.value]}
            onChange={(e) => onChange(itemType.value, e.target.checked)}
          >
            {itemType.label}
          </Checkbox>
        );
      })}
    </SidebarStack>
  );
};
