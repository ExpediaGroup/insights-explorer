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

import type { IconProps } from '@chakra-ui/react';
import { Icon, Tooltip } from '@chakra-ui/react';
import titleize from 'titleize';

import { iconFactory } from '../../shared/icon-factory';
import { getItemType } from '../../shared/item-type';

/**
 * Icon for Item Type (insight, template, page, etc)
 *
 * @param props RouterLinkProps
 */
export const ItemTypeIcon = ({ itemType, ...extraProps }: { itemType: string } & IconProps) => {
  const { iconKey, color: bg } = getItemType(itemType);

  return (
    <Tooltip label={`${titleize(itemType)}`} aria-label={`${titleize(itemType)} icon`}>
      <span>
        <Icon
          as={iconFactory(iconKey)}
          rounded="md"
          fontSize="3xl"
          p="0.25rem"
          bg={bg}
          color="white"
          {...extraProps}
          __css={{
            'path, g': {
              stroke: 'currentColor'
            }
          }}
        />
      </span>
    </Tooltip>
  );
};
