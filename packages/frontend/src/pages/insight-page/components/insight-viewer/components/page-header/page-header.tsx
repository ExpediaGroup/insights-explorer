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
  Heading,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useDisclosure,
  useToast,
  MenuDivider
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { gql, useMutation } from 'urql';

import { InsightCollaboratorsModal } from '../../../../../../components/insight-collaborators-modal/insight-collaborators-modal';
import { ItemTypeIcon } from '../../../../../../components/item-type-icon/item-type-icon';
import { LikeButton } from '../../../../../../components/like-button/like-button';
import { LikedByTooltip } from '../../../../../../components/liked-by-tooltip/liked-by-tooltip';
import { Link } from '../../../../../../components/link/link';
import { Linkify } from '../../../../../../components/linkify/linkify';
import { NumberIconButton } from '../../../../../../components/number-icon-button/number-icon-button';
import { Insight, User } from '../../../../../../models/generated/graphql';
import { getInsightGradient } from '../../../../../../shared/gradient';
import { iconFactory, iconFactoryAs } from '../../../../../../shared/icon-factory';
import { RootState } from '../../../../../../store/store';
import { CloneDialog } from '../clone-dialog/clone-dialog';
import { DeleteDialog } from '../delete-dialog/delete-dialog';

const SYNC_INSIGHT_MUTATION = gql`
  mutation SyncInsight($insightId: ID!) {
    syncInsight(insightId: $insightId) {
      id
    }
  }
`;

interface Props {
  insight: Insight;
  isExport: boolean;
  nextInsight?: Pick<Insight, 'id' | 'name' | 'fullName' | 'itemType'>;
  previousInsight?: Pick<Insight, 'id' | 'name' | 'fullName' | 'itemType'>;
  onClone: () => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onFetchLikedBy: (insightId?: string) => Promise<User[]>;
  onLike: (liked: boolean) => Promise<boolean>;
}

export const PageHeader = ({
  insight,
  nextInsight,
  previousInsight,
  isExport,
  onClone,
  onDelete,
  onFetchLikedBy,
  onLike
}: Props) => {
  const { loggedIn } = useSelector((state: RootState) => state.user);

  const toast = useToast();
  const [, sync] = useMutation(SYNC_INSIGHT_MUTATION);

  // Collaborators modal
  const { isOpen: isCollaboratorsOpen, onOpen: onCollaboratorsOpen, onClose: onCollaboratorsClose } = useDisclosure();

  // Clone dialog
  const { isOpen: isCloneOpen, onOpen: onCloneOpen, onClose: onCloneClose } = useDisclosure();

  // Delete dialog
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  if (insight == null) {
    return <Box></Box>;
  }

  const syncInsight = async () => {
    const result = await sync({
      insightId: insight.id
    });

    if (result.error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to sync.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
      return;
    }

    toast({
      position: 'bottom-right',
      title: 'Insight synced.',
      status: 'success',
      duration: 3000,
      isClosable: true
    });
  };

  // This indicates that the upstream repository is missing
  // We can still show the cached insight, but with a warning message
  const isMissing = insight.repository.isMissing;

  // If the resource is missing we can't edit or clone.
  const canEdit = !isMissing;
  const canClone = !isMissing;

  const likeLabel = insight.viewerHasLiked ? 'Unlike this Page' : 'Like this Page';

  const showPreviousAndNextButtons = previousInsight || nextInsight;
  const nextInsightLink = nextInsight ? `/${nextInsight?.itemType}/${nextInsight?.fullName}` : '';
  const previousInsightLink = previousInsight ? `/${previousInsight?.itemType}/${previousInsight?.fullName}` : '';

  return (
    <>
      <VStack direction="column" align="stretch" p="0.5rem" bgGradient={getInsightGradient(insight)}>
        {!isExport && (
          <HStack spacing="1rem" align="top" justify="space-between">
            <ItemTypeIcon itemType={insight.itemType} fontSize={{ base: '2rem' }} />

            <HStack spacing="0">
              <HStack spacing="1rem" marginRight="1rem">
                {showPreviousAndNextButtons && (
                  <Link to={previousInsightLink}>
                    <IconButton
                      aria-label="Previous Insight"
                      size="sm"
                      icon={iconFactoryAs('previousPage')}
                      isDisabled={previousInsight == null}
                    />
                  </Link>
                )}
                {showPreviousAndNextButtons && (
                  <Link to={nextInsightLink}>
                    <IconButton
                      aria-label="Next Insight"
                      size="sm"
                      icon={iconFactoryAs('nextPage')}
                      isDisabled={nextInsight == null}
                    />
                  </Link>
                )}
              </HStack>

              <RouterLink to={`/${insight.itemType}/${insight.fullName}/discuss`}>
                <NumberIconButton label="Discussion" icon={iconFactoryAs('comments')} number={insight.commentCount} />
              </RouterLink>

              <LikedByTooltip
                label={likeLabel}
                likeCount={insight.likeCount}
                onFetchLikedBy={() => onFetchLikedBy(insight.id)}
              >
                <LikeButton
                  liked={insight.viewerHasLiked}
                  label={likeLabel}
                  onLike={onLike}
                  likeCount={insight.likeCount}
                />
              </LikedByTooltip>

              <RouterLink
                to={`/activities/${encodeURIComponent(`insight:${insight.fullName} activityType:VIEW_INSIGHT`)}`}
              >
                <NumberIconButton label="Views" icon={iconFactoryAs('views')} number={insight.viewCount + 1} />
              </RouterLink>

              <Menu>
                <MenuButton as={Box} display="inline-block">
                  <IconButton variant="ghost" aria-label="Additional commands" icon={iconFactoryAs('optionsMenu')} />
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={onCloneOpen} isDisabled={!canClone}>
                    <Icon as={iconFactory('clone')} mr="0.5rem" />
                    Clone Page
                  </MenuItem>

                  <MenuDivider />

                  <RouterLink to={`/${insight.itemType}/${insight.fullName}/activity`}>
                    <MenuItem>
                      <Icon as={iconFactory('activities')} mr="0.5rem" />
                      Activity
                    </MenuItem>
                  </RouterLink>
                  <RouterLink to={`/${insight.itemType}/${insight.fullName}/json`}>
                    <MenuItem>
                      <Icon as={iconFactory('json')} mr="0.5rem" />
                      View JSON
                    </MenuItem>
                  </RouterLink>

                  <MenuDivider />

                  <MenuItem onClick={syncInsight}>
                    <Icon as={iconFactory('sync')} mr="0.5rem" />
                    Sync Now
                  </MenuItem>

                  {loggedIn && (
                    <>
                      <MenuDivider />
                      <MenuGroup title="Admin">
                        <MenuItem onClick={onCollaboratorsOpen} isDisabled={insight.viewerPermission !== 'ADMIN'}>
                          <Icon as={iconFactory('permissions')} mr="0.5rem" />
                          Collaborators
                        </MenuItem>

                        <MenuItem onClick={onDeleteOpen} isDisabled={insight.viewerPermission !== 'ADMIN'}>
                          <Icon as={iconFactory('trash')} mr="0.5rem" />
                          Delete Page
                        </MenuItem>
                      </MenuGroup>
                    </>
                  )}
                </MenuList>
              </Menu>

              <RouterLink to={`/${insight.itemType}/${insight.fullName}/edit`}>
                <Button width={{ base: '100%', md: 'unset' }} bg="gray.200" isDisabled={!canEdit}>
                  Edit
                </Button>
              </RouterLink>
            </HStack>
          </HStack>
        )}

        <VStack align="center" paddingTop="2rem" paddingBottom="4rem">
          <Heading as="h1" size="lg" flexGrow={1}>
            {insight.name}
          </Heading>

          <Text>
            <Linkify>{insight.description}</Linkify>
          </Text>
        </VStack>
      </VStack>

      <CloneDialog insight={insight} isOpen={isCloneOpen} onClone={onClone} onClose={onCloneClose} />

      <DeleteDialog insight={insight} isOpen={isDeleteOpen} onDelete={onDelete} onClose={onDeleteClose} />

      <InsightCollaboratorsModal insightId={insight.id} isOpen={isCollaboratorsOpen} onClose={onCollaboratorsClose} />
    </>
  );
};
