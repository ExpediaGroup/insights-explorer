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

import { IconButton, Input, InputGroup, InputLeftElement, InputRightElement, Tooltip } from '@chakra-ui/react';
import { ReactElement } from 'react';

import { iconFactoryAs } from '../../../../shared/icon-factory';

interface Props {
  query: any;
  canClear: boolean;
  onQueryChange: (updatedQuery: string) => void;
  onClear: () => void;
}

export const SearchBox = ({ query, canClear, onQueryChange, onClear }: Props): ReactElement => {
  return (
    <InputGroup>
      <InputLeftElement pointerEvents="none" children={iconFactoryAs('search', { color: 'frost.200' })} width="3rem" />
      <Input
        size="md"
        value={query}
        variant="filled"
        placeholder="Search..."
        borderRadius="0.5rem"
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="Search"
      />
      {canClear && (
        <InputRightElement zIndex="unset">
          <Tooltip placement="left" label="Clear search" aria-label="Clear search">
            <IconButton
              variant="solid"
              size="sm"
              bgColor="frost.200"
              icon={iconFactoryAs('close')}
              onClick={onClear}
              aria-label="Clear search"
            />
          </Tooltip>
        </InputRightElement>
      )}
    </InputGroup>
  );
};
