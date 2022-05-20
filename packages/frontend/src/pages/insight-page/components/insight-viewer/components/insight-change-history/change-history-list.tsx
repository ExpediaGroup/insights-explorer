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

import { Box, Flex, StackDivider, useToast, VStack } from '@chakra-ui/react';
import { gql, useQuery } from 'urql';

import { ActivityListSkeleton } from '../../../../../../components/activity-list/components/activity-list-skeleton/activity-list-skeleton';

import { ChangeHistoryView } from './change-history-view';

const CHANGE_HISTORY_FRAGMENT = gql`
  fragment ChangeHistoryFields on Insight {
    id
    name
    namespace
    changeHistory {
      edges {
        node {
          oid
          abbreviatedOid
          committedDate
          changedFiles
          message
          deletions
          additions
          author {
            team
            email
            userName
            displayName
          }
        }
      }
    }
  }
`;

const INSIGHT_CHANGE_HISTORY_QUERY = gql`
  ${CHANGE_HISTORY_FRAGMENT}
  query InsightChangeHistory($id: ID!) {
    insight(insightId: $id) {
      ...ChangeHistoryFields
    }
  }
`;

export interface ChangeHistoryProps {
  insightId?: string;
  insightFullName?: string;
}

export const ChangeHistoryList = ({ insightId, insightFullName }: ChangeHistoryProps) => {
  const [{ data, error, fetching: changeHistoryFetching }] = useQuery({
    query: INSIGHT_CHANGE_HISTORY_QUERY,
    variables: { id: insightId }
  });

  const toast = useToast();

  if (error) {
    toast({
      position: 'bottom-right',
      title: `Error while fetcing Change History.`,
      status: 'error',
      duration: 9000,
      isClosable: true
    });
    console.log(`Error while fetching Change History: ${error}`);
  }

  if (changeHistoryFetching || data === undefined) {
    // TODO: Create skeleton for Change History?
    return <ActivityListSkeleton />;
  }

  const changeHistory = data.insight.changeHistory;

  if (changeHistory) {
    console.log(`Changes: ${changeHistory.edges.length}`);
  }

  return (
    <Box>
      <Flex>
        <VStack flexGrow={1} spacing="0.5rem" align="stretch" divider={<StackDivider borderColor="snowstorm.100" />}>
          {changeHistory.edges.map((edge) => (
            <ChangeHistoryView key={edge.node.id} changeEdge={edge} insightFullName={insightFullName} />
          ))}
        </VStack>
      </Flex>
    </Box>
  );
};
