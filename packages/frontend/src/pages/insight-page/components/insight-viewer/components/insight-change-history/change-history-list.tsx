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
import { gql, useMutation, useQuery } from 'urql';

import { ActivityListSkeleton } from '../../../../../../components/activity-list/components/activity-list-skeleton/activity-list-skeleton';
import { Alert } from '../../../../../../components/alert/alert';

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

const ROLL_BACK_CHANGE_MUTATION = gql`
  mutation RollBackChange($gitHash: String!, $insightId: ID!) {
    rollBackChange(gitHash: $gitHash, insightId: $insightId) {
      id
    }
  }
`;

export interface ChangeHistoryProps {
  insightId?: string;
  insightFullName?: string;
  canEdit?: boolean;
}

export const ChangeHistoryList = ({ insightId, insightFullName, canEdit }: ChangeHistoryProps) => {
  const toast = useToast();

  const [{ data, error, fetching: changeHistoryFetching }, reexecuteChangeHistory] = useQuery({
    query: INSIGHT_CHANGE_HISTORY_QUERY,
    variables: { id: insightId }
  });

  const [{ fetching: fetchingRollBack }, rollBackChange] = useMutation(ROLL_BACK_CHANGE_MUTATION);

  const onRollBackChange = async (gitHash) => {
    const { error } = await rollBackChange({
      gitHash,
      insightId
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: `Error when trying to roll back.`,
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true
      });

      return false;
    }

    toast({
      position: 'bottom-right',
      title: `Rolled back successfull.`,
      description: `Successfully rolled back to commit ${gitHash}`,
      status: 'success',
      duration: 9000,
      isClosable: true
    });

    reexecuteChangeHistory({ requestPolicy: 'network-only' });
  };

  if (error) {
    toast({
      position: 'bottom-right',
      title: `Error while fetching Change History.`,
      description: error.message,
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

  return (
    <Box>
      {fetchingRollBack && (
        <Alert info={`Rolling Back to commit.\nPlease wait, this might take some time.`} mb="1rem" />
      )}

      {!canEdit && (
        <Alert
          warning={`You don't have permissions to publish changes to this Insight. So you can't roll back to a previous commit.`}
          mb="1rem"
        />
      )}

      <Flex>
        <VStack flexGrow={1} spacing="0.5rem" align="stretch" divider={<StackDivider borderColor="snowstorm.100" />}>
          {changeHistory.edges.map((edge, index) => (
            <ChangeHistoryView
              key={edge.node.abbreviatedOid}
              changeEdge={edge}
              insightFullName={insightFullName}
              enableRollBack={index > 0 && canEdit}
              onRollBackChange={onRollBackChange}
              fetchingRollBack={fetchingRollBack}
            />
          ))}
        </VStack>
      </Flex>
    </Box>
  );
};
