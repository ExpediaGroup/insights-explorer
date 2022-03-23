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

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  List,
  ListIcon,
  ListItem,
  Spinner,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useState } from 'react';

import { gql, useMutation, useQuery } from 'urql';

import { Alert } from '../../../../../../components/alert/alert';
import { Card } from '../../../../../../components/card/card';
import { ItemTypeIcon } from '../../../../../../components/item-type-icon/item-type-icon';
import { Link } from '../../../../../../components/link/link';
import type { Draft, Insight, User } from '../../../../../../models/generated/graphql';
import { formatRelativeIntl } from '../../../../../../shared/date-utils';
import { iconFactory } from '../../../../../../shared/icon-factory';

const ALL_DRAFTS_QUERY = gql`
  query allDraftsForUser($userId: String!) {
    allDraftsForUser(userId: $userId) {
      draftKey
      updatedAt
      draftData
      insight {
        id
        fullName
        name
        itemType
      }
    }
  }
`;

const DELETE_DRAFT_MUTATION = gql`
  mutation DeleteDraft($draftKey: String!) {
    deleteDraft(draftKey: $draftKey) {
      draftKey
    }
  }
`;

const groupDraftsByInsight = (drafts?: Draft[]): { insight?: Insight; drafts: Draft[] }[] => {
  if (drafts === undefined || drafts.length === 0) {
    return [];
  }

  console.log(drafts);
  const insights = drafts?.reduce<{ insight?: Insight; drafts: Draft[] }[]>((acc, draft) => {
    const existing = acc.find(
      (group) => (group.insight == null && draft.insight == null) || group.insight?.id === draft.insight?.id
    );
    if (existing) {
      existing.drafts.push(draft);
    } else {
      acc.push({ insight: draft.insight, drafts: [draft] });
    }

    return acc;
  }, []);

  console.log('insights', insights);

  return insights;
};

interface Props {
  user: User;
}

export const UserDrafts = ({ user }: Props) => {
  const toast = useToast();
  const [discarding, setDiscarding] = useState<string | null>(null);

  // Existing In-Progress Drafts
  const [{ data: allDraftsData, fetching }, reexecutePendingDrafts] = useQuery({
    query: ALL_DRAFTS_QUERY,
    variables: {
      userId: user.id
    },
    requestPolicy: 'cache-and-network'
  });

  const draftGroups = groupDraftsByInsight(allDraftsData?.allDraftsForUser);

  const [, discardDraft] = useMutation(DELETE_DRAFT_MUTATION);

  const onDiscardDraft = async (draftKeyToDiscard: string): Promise<boolean> => {
    setDiscarding(draftKeyToDiscard);
    const { error } = await discardDraft({
      draftKey: draftKeyToDiscard
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to discard Draft.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });

      setDiscarding(null);
      return false;
    }

    toast({
      position: 'bottom-right',
      title: 'Discarded draft',
      status: 'success',
      duration: 2000,
      isClosable: true
    });

    reexecutePendingDrafts({ requestPolicy: 'network-only' });
    setDiscarding(null);
    return true;
  };

  return (
    <Flex mt="0" direction="column" justify="stretch" flexGrow={2}>
      <Alert status="secure" mb="0.5rem" message="This tab is only visible to you." />

      {fetching && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />}

      {!fetching && (
        <>
          {draftGroups.length === 0 && <Alert info={`No Drafts found.`} />}
          {draftGroups.length > 0 && (
            <VStack spacing="1rem" align="stretch" flexGrow={2}>
              {draftGroups.map((draftGroup) => (
                <VStack
                  as={Card}
                  spacing="1rem"
                  align="stretch"
                  p="1rem"
                  key={draftGroup.insight?.name ?? 'new-insight'}
                >
                  <HStack align="center">
                    {draftGroup.insight && <ItemTypeIcon itemType={draftGroup.insight.itemType ?? 'insight'} />}

                    <Heading as="h2" fontSize="lg">
                      {draftGroup.insight?.name == null ? 'New Insight' : draftGroup.insight?.name}
                    </Heading>
                  </HStack>
                  {draftGroup.drafts.map((draft) => (
                    <Flex as={List} flexDirection="column" align="stretch" key={draft.draftKey}>
                      <HStack
                        as={ListItem}
                        key={draft.draftKey}
                        align={{ base: 'stretch', md: 'center' }}
                        spacing={{ base: 0, md: '1rem' }}
                        ml="1rem"
                        mb="0.25rem"
                        flexDirection={{ base: 'column', md: 'row' }}
                      >
                        <Box flexGrow={2}>
                          <ListIcon as={iconFactory('edit')} />
                          {draft.draftKey} (last modified {formatRelativeIntl(draft.updatedAt as unknown as string)})
                        </Box>

                        <Link
                          to={`${
                            draft.insight == null ? '' : `/${draft.insight.itemType}/${draft.insight.fullName}`
                          }/edit/${draft.draftKey}`}
                          display="inline"
                        >
                          <Button variant="solid" bg="frost.300" size="sm" width={{ base: '100%', md: 'unset' }}>
                            Resume
                          </Button>
                        </Link>
                        <Button
                          variant="link"
                          size="sm"
                          width={{ base: '100%', md: 'unset' }}
                          pt={{ base: '0.5rem', md: 'unset' }}
                          onClick={() => onDiscardDraft(draft.draftKey)}
                          isLoading={discarding === draft.draftKey}
                        >
                          Discard
                        </Button>
                      </HStack>
                    </Flex>
                  ))}
                </VStack>
              ))}
            </VStack>
          )}
        </>
      )}
    </Flex>
  );
};
