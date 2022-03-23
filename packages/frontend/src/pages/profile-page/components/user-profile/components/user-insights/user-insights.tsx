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

import { Box, Flex, MenuItemOption, MenuOptionGroup } from '@chakra-ui/react';
import { useState } from 'react';

import { IconButtonMenu } from '../../../../../../components/icon-button-menu/icon-button-menu';
import { InsightList } from '../../../../../../components/insight-list/insight-list';
import type { InsightConnection, User } from '../../../../../../models/generated/graphql';
import { iconFactory } from '../../../../../../shared/icon-factory';
import type { SearchOptions } from '../../../../../../store/search.slice';

interface Props {
  user: User;
  insightConnection?: InsightConnection;
}

export const UserInsights = ({ user, insightConnection }: Props) => {
  const [options, setOptions] = useState<SearchOptions>({ layout: 'square' });

  const onLayoutChange = (layout) => {
    setOptions({ ...options, layout });
  };

  return (
    <Flex flexDirection="column">
      <Flex flexDirection="row" align="center" justify="flex-end">
        {/* <Heading as="h2" size="md" my="1rem" flexGrow={2}>
          {user.displayName}'s Insights
        </Heading> */}

        <IconButtonMenu aria-label="Options menu" icon={iconFactory('optionsMenu')} variant="ghost" tooltip="Options">
          <MenuOptionGroup title="Layout" type="radio" value={options.layout} onChange={onLayoutChange}>
            <MenuItemOption value="default">Default</MenuItemOption>
            <MenuItemOption value="compact">Compact</MenuItemOption>
            <MenuItemOption value="square">Cards</MenuItemOption>
          </MenuOptionGroup>
        </IconButtonMenu>
      </Flex>
      <Box mt="-1.5rem">
        <InsightList insightConnection={insightConnection} options={options} />
      </Box>
    </Flex>
  );
};
