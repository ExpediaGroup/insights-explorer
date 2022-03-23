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

import type { TagProps } from '@chakra-ui/react';
import { Tag, TagLabel } from '@chakra-ui/react';
import { useDispatch } from 'react-redux';

import { searchSlice } from '../../store/search.slice';
import { Link } from '../link/link';

interface Props {
  team: string;
  dispatchSearch?: boolean;
}

export const TeamTag = ({ team, dispatchSearch = false, ...tagProps }: Props & TagProps) => {
  const dispatch = useDispatch();

  let onClick = (e) => {
    return;
  };

  if (dispatchSearch) {
    onClick = (e) => {
      e.preventDefault();
      dispatch(searchSlice.actions.setQuery(`team:"${team}"`));
    };
  }

  return (
    <Link to={`/search/${encodeURIComponent(`team:"${team}"`)}`} onClick={onClick}>
      <Tag
        bg="nord12.200"
        rounded="full"
        size="md"
        _hover={{
          boxShadow: '0 0 0 3px rgba(136, 192, 208, 0.6)'
        }}
        {...tagProps}
      >
        <TagLabel>{team}</TagLabel>
      </Tag>
    </Link>
  );
};
