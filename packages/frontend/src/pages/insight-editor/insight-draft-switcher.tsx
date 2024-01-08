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

import { useBreakpointValue } from '@chakra-ui/media-query';
import {
  Alert as ChakraAlert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Collapse,
  Flex,
  Heading,
  HStack,
  IconButton,
  List,
  ListIcon,
  ListItem,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { gql, useMutation, useQuery } from 'urql';

import { Link as RouterLink } from '../../components/link/link';
import { formatRelativeIntl } from '../../shared/date-utils';
import { iconFactory, iconFactoryAs } from '../../shared/icon-factory';
import { ItemType } from '../../shared/item-type';
import type { RootState } from '../../store/store';
import { UserHealthCheck } from '../main-page/components/user-health-check/user-health-check';

import { InsightDraftEditor } from './insight-draft-editor';

const PENDING_DRAFTS_QUERY = gql`
  query draftsForUser($userId: String!, $insightId: ID) {
    draftsForUser(userId: $userId, insightId: $insightId) {
      draftKey
      updatedAt
      draftData
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

/**
 * The Insight Editor uses a draftKey to persist Drafts, and this key is
 * stored in the URL.  This component performs the following:
 *
 * 1) Whenever loaded without a draft key, it will attempt to retrieve pending drafts for the given Insight.
 *
 * 2) If there are existing drafts pending, it will prompt the user to select one OR start a new draft.
 *
 * 3) After either selecting an existing draft or opting to generate a new draft key, the component directs
 * to the new URL.
 *
 * E.g. URLs like this:
 *
 * https://iex/edit
 *
 * are converted to this:
 *
 * https://iex/edit/S6sRWzhIQlFzW66fnPiLg
 *
 * The old URL is replaced, to avoid an extra entry in the browser history.
 *
 * The InsightDraftEditor is not rendered until the draft has been loaded or initialized
 */
export const InsightDraftSwitcher = ({ insight, onRefresh }) => {
  const toast = useToast();
  const location = useLocation();
  const state: { itemType?: ItemType } | null = location.state as any;

  const navigate = useNavigate();
  const { '*': draftKey } = useParams();
  const hasDraftKey = draftKey !== '';
  const { isOpen, onToggle } = useDisclosure();

  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });

  const { userInfo } = useSelector((state: RootState) => state.user);

  // Existing In-Progress Drafts
  const [{ data: pendingDraftsData, fetching }, reexecutePendingDrafts] = useQuery({
    query: PENDING_DRAFTS_QUERY,
    variables: {
      userId: userInfo?.id,
      insightId: insight?.id || null
    },
    requestPolicy: 'network-only'
  });

  const pendingDrafts = pendingDraftsData?.draftsForUser || [];

  const createNewDraft = useCallback(() => {
    navigate('./' + nanoid(), { replace: true, state });
  }, [navigate, state]);

  const [, discardDraft] = useMutation(DELETE_DRAFT_MUTATION);

  const onDiscardDraft = async (draftKeyToDiscard: string): Promise<boolean> => {
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

    return true;
  };

  useEffect(() => {
    // Wait for pending drafts to load
    if (pendingDraftsData === undefined) {
      return;
    }

    // If no pending drafts and no draft key, generate a new draft automatically
    if (pendingDrafts.length === 0 && draftKey === '') {
      createNewDraft();
      return;
    }
  }, [createNewDraft, draftKey, navigate, pendingDrafts.length, pendingDraftsData, state]);

  return (
    <Flex mt="0" direction="column" justify="stretch" flexGrow={2}>
      <UserHealthCheck />

      {!draftKey && fetching && (
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
      )}

      {((hasDraftKey && pendingDrafts.length > 1 && insight !== null) ||
        (!hasDraftKey && pendingDrafts.length > 0)) && (
        <ChakraAlert status="info" borderRadius="0.25rem" mb="1rem" alignItems="flex-start" wordBreak="break-word">
          <AlertIcon flexShrink={0} />
          <VStack spacing="1rem" align="stretch" flexGrow={2} fontSize={{ base: 'sm', md: 'md' }}>
            {!hasDraftKey && (
              <Text>
                <strong>Info:</strong> You have {pendingDrafts.length} unpublished draft
                {pendingDrafts.length > 1 ? 's' : ''} for {insight === null ? 'a new Insight' : 'this Insight'}; do you
                want to resume editing an existing draft or create a new draft?
              </Text>
            )}
            {hasDraftKey && (
              <Flex align="stretch" onClick={() => onToggle()}>
                <Text flexGrow={2}>
                  <strong>Info:</strong> You have {pendingDrafts.length} unpublished draft
                  {pendingDrafts.length > 1 ? 's' : ''} for this Insight.
                  {!isOpen && '  Expand this message to see more details.'}
                </Text>
                <IconButton
                  icon={isOpen ? iconFactoryAs('chevronUp') : iconFactoryAs('chevronDown')}
                  size="xs"
                  variant="ghost"
                  aria-label={isOpen ? 'Collapse' : 'Expand'}
                  onClick={() => onToggle()}
                >
                  {isOpen ? 'Collapse' : 'Expand'}
                </IconButton>
              </Flex>
            )}
            <Collapse in={!hasDraftKey || isOpen} animateOpacity>
              <VStack spacing="1rem" align="flex-start">
                <Box>
                  <Heading as="h3" fontSize="md" mb="0.5rem">
                    Existing Draft{pendingDrafts.length > 1 ? 's' : ''}
                  </Heading>
                  <Flex as={List} flexDirection="column" align="stretch">
                    {pendingDrafts.map((draft) => (
                      <HStack
                        as={ListItem}
                        key={draft.draftKey}
                        align={{ base: 'stretch', md: 'center' }}
                        spacing={{ base: 0, md: '1rem' }}
                        ml="1rem"
                        my={{ base: '0.5rem', md: '0.25rem' }}
                        flexDirection={{ base: 'column', md: 'row' }}
                      >
                        <Box flexGrow={2}>
                          <ListIcon as={iconFactory('edit')} />
                          {draft.draftKey}
                        </Box>
                        <Box flexGrow={2}>(last modified {formatRelativeIntl(draft.updatedAt)})</Box>
                        {draftKey === draft.draftKey && <Badge>Currently Editing</Badge>}
                        {draftKey !== draft.draftKey && (
                          <HStack align="stretch" spacing="1rem" pt={{ base: '0.25rem', md: 'unset' }}>
                            <RouterLink
                              to={`${insight === null ? '' : `/${insight.itemType}/${insight.fullName}`}/edit/${
                                draft.draftKey
                              }`}
                              display="inline"
                            >
                              <Button variant="solid" bg="frost.300" size="sm" width={{ base: '100%', md: 'unset' }}>
                                Resume
                              </Button>
                            </RouterLink>
                            <Button
                              variant="link"
                              size="sm"
                              width={{ base: '100%', md: 'unset' }}
                              pt={{ base: '0.25rem', md: 'unset' }}
                              onClick={() => onDiscardDraft(draft.draftKey)}
                            >
                              Discard
                            </Button>
                          </HStack>
                        )}
                      </HStack>
                    ))}
                  </Flex>
                </Box>
                {!hasDraftKey && (
                  <Button variant="solid" bg="frost.300" onClick={createNewDraft} size={buttonSize}>
                    Create a New Draft
                  </Button>
                )}
              </VStack>
            </Collapse>
          </VStack>
        </ChakraAlert>
      )}

      {draftKey && (
        <InsightDraftEditor
          insight={insight}
          draftKey={draftKey}
          itemType={state?.itemType ?? ItemType.INSIGHT}
          onRefresh={onRefresh}
        />
      )}
    </Flex>
  );
};
