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

import { Box, BoxProps, Flex, VStack } from '@chakra-ui/react';

import { FetchActivityList } from '../../../../../../components/activity-list/fetch-activity-list';
import { Crumbs } from '../../../../../../components/crumbs/crumbs';
import { Insight } from '../../../../../../models/generated/graphql';

interface Props {
  insight: Insight;
}

export const InsightActivity = ({ insight, ...props }: Props & BoxProps) => {
  const breadcrumbs = [
    { text: insight.name, link: `/${insight.itemType}/${insight.fullName}` },
    { text: 'Activity', link: '#' }
  ];

  return (
    <VStack spacing="1rem" align="stretch">
      <Flex direction="row" align="center" p="0.5rem" height="50px">
        <Crumbs crumbs={breadcrumbs} />
      </Flex>

      <Box p="0.5rem" {...props}>
        <FetchActivityList query={`insight:${insight.fullName}`} />
      </Box>
    </VStack>
  );
};
