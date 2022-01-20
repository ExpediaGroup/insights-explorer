/**
 * Copyright 2022 Expedia, Inc.
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

import { BoxProps, HStack, IconButton, Tooltip } from '@chakra-ui/react';
import titleize from 'titleize';

import { Link } from '../../../../../../components/link/link';
import { Insight } from '../../../../../../models/generated/graphql';
import { iconFactoryAs } from '../../../../../../shared/icon-factory';

interface Props {
  insight: Insight;
  nextInsight?: Pick<Insight, 'id' | 'name' | 'fullName' | 'itemType'>;
  previousInsight?: Pick<Insight, 'id' | 'name' | 'fullName' | 'itemType'>;
}

export const NavigationButtons = ({ insight, nextInsight, previousInsight, ...boxProps }: Props & BoxProps) => {
  const showPreviousAndNextButtons = previousInsight || nextInsight;
  const nextInsightLink = nextInsight ? `/${nextInsight?.itemType}/${nextInsight?.fullName}` : '';
  const previousInsightLink = previousInsight ? `/${previousInsight?.itemType}/${previousInsight?.fullName}` : '';

  return (
    <HStack spacing="1rem" {...boxProps}>
      {showPreviousAndNextButtons && (
        <>
          <Link to={previousInsightLink} flexGrow={{ base: '1', md: 'unset' }}>
            <Tooltip
              label={`Previous ${titleize(insight.itemType)}`}
              aria-label={`Previous ${titleize(insight.itemType)}`}
            >
              <IconButton
                aria-label={`Previous ${titleize(insight.itemType)}`}
                size="sm"
                icon={iconFactoryAs('previousPage')}
                isDisabled={previousInsight == null}
                width={{ base: '100%', md: 'unset' }}
              />
            </Tooltip>
          </Link>
          <Link to={nextInsightLink} flexGrow={{ base: '1', md: 'unset' }}>
            <Tooltip label={`Next ${titleize(insight.itemType)}`} aria-label={`Next ${titleize(insight.itemType)}`}>
              <IconButton
                aria-label={`Next ${titleize(insight.itemType)}`}
                size="sm"
                icon={iconFactoryAs('nextPage')}
                isDisabled={nextInsight == null}
                width={{ base: '100%', md: 'unset' }}
              />
            </Tooltip>
          </Link>
        </>
      )}
    </HStack>
  );
};
