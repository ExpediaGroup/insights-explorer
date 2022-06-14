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

import type { BoxProps } from '@chakra-ui/react';
import { Flex, useDisclosure, VStack } from '@chakra-ui/react';

import { Crumbs } from '../../../../../../components/crumbs/crumbs';
import type { Insight } from '../../../../../../models/generated/graphql';

import { ChangeHistoryList } from './change-history-list';

interface Props {
  insight: Insight;
}

export const InsightChangeHistory = ({ insight, ...props }: Props & BoxProps) => {
  const breadcrumbs = [
    { text: insight.name, link: `/${insight.itemType}/${insight.fullName}` },
    { text: 'Change History', link: '#' }
  ];
  const { isOpen, onOpen, onToggle } = useDisclosure();
  const open = false;
  return (
    <VStack spacing="1rem" align="stretch">
      <Flex direction="row" align="center" height="50px">
        <Crumbs crumbs={breadcrumbs} />
      </Flex>
      <ChangeHistoryList insightId={insight.id} insightFullName={insight.fullName} />
    </VStack>
  );
};
