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

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Text } from '@chakra-ui/react';

import { iconFactoryAs } from '../../shared/icon-factory';
import { Link } from '../link/link';

export interface Crumb {
  text: string;
  link: string;
}

export const Crumbs = ({ crumbs }: { crumbs: Crumb[] }) => {
  return (
    <Breadcrumb spacing="0.5rem" separator={iconFactoryAs('chevronRight', { color: 'gray.500' })}>
      {crumbs.map(({ link, text }, index) => {
        return (
          <BreadcrumbItem isCurrentPage={link === '#'} key={link + '-' + text}>
            {(link !== '#' && (
              <BreadcrumbLink as={Link} to={link}>
                {text}
              </BreadcrumbLink>
            )) ||
              (index === crumbs.length - 1 && <Text as="strong">{text}</Text>) || <Text>{text}</Text>}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};
