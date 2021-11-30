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

import { HStack, Icon, Text } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { IconType } from 'react-icons';

import { iconFactory } from '../../shared/icon-factory';

type Props =
  | {
      children: ReactElement[] | ReactElement | string | (string | null)[];
      iconName: string;
      iconColor?: string;
    }
  | {
      children: ReactElement[] | ReactElement | string | (string | null)[];
      icon: IconType;
      iconColor?: string;
    };

export const TextWithIcon = ({ children, iconColor = 'frost.400', ...props }: Props) => {
  let icon: IconType;
  if ('icon' in props) {
    icon = props.icon;
  } else {
    icon = iconFactory(props.iconName);
  }

  return (
    <HStack>
      <Icon as={icon} color={iconColor} />
      <Text fontSize="md">{children}</Text>
    </HStack>
  );
};
