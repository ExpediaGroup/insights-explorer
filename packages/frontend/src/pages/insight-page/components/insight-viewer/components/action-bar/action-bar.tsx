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

import {
  Box,
  Button,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import titleize from 'titleize';
import { gql, useMutation } from 'urql';

import { InsightCollaboratorsModal } from '../../../../../../components/insight-collaborators-modal/insight-collaborators-modal';
import { LikeButton } from '../../../../../../components/like-button/like-button';
import { LikedByTooltip } from '../../../../../../components/liked-by-tooltip/liked-by-tooltip';
import { NumberIconButton } from '../../../../../../components/number-icon-button/number-icon-button';
import type { Insight, User } from '../../../../../../models/generated/graphql';
import { iconFactory, iconFactoryAs } from '../../../../../../shared/icon-factory';
import type { RootState } from '../../../../../../store/store';
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
  onDelete: (archiveRepo: boolean) => Promise<boolean>;
  onFetchLikedBy: (insightId?: string) => Promise<User[]>;
  onLike: (liked: boolean) => Promise<boolean>;
}

export const ActionBar = ({
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

  // Collaborators modal
  const { isOpen: isCollaboratorsOpen, onOpen: onCollaboratorsOpen, onClose: onCollaboratorsClose } = useDisclosure();

  // Clone dialog
  const { isOpen: isCloneOpen, onOpen: onCloneOpen, onClose: onCloneClose } = useDisclosure();

  // Delete dialog
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // This indicates that the upstream repository is missing
  // We can still show the cached insight, but with a warning message
  const isMissing = insight.repository.isMissing;

  // If the resource is missing we can't edit or clone.
  const canEdit = !isMissing;
  const canClone = !isMissing;

  const likeLabel = insight.viewerHasLiked ? 'Unlike this Insight' : 'Like this Insight';

  return (
    <>
      <HStack spacing="0" justify={{ base: 'space-between', md: 'unset' }}>
        <RouterLink to={`/${insight.itemType}/${insight.fullName}/discuss`}>
          <NumberIconButton label="Discussion" icon={iconFactoryAs('comments')} number={insight.commentCount} />
        </RouterLink>

        <LikedByTooltip
          label={likeLabel}
          likeCount={insight.likeCount}
          onFetchLikedBy={() => onFetchLikedBy(insight.id)}
        >
          <LikeButton liked={insight.viewerHasLiked} label={likeLabel} onLike={onLike} likeCount={insight.likeCount} />
        </LikedByTooltip>

        <RouterLink to={`/activities/${encodeURIComponent(`insight:${insight.fullName} activityType:VIEW_INSIGHT`)}`}>
          <NumberIconButton label="Views" icon={iconFactoryAs('views')} number={insight.viewCount + 1} />
        </RouterLink>

        <Menu>
          <MenuButton as={Box} display="inline-block">
            <IconButton variant="ghost" aria-label="Additional commands" icon={iconFactoryAs('optionsMenu')} />
          </MenuButton>
          <MenuList>
            <MenuItem onClick={onCloneOpen} isDisabled={!canClone}>
              <Icon as={iconFactory('clone')} mr="0.5rem" />
              Clone {titleize(insight.itemType)}
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

                  <MenuItem
                    onClick={onDeleteOpen}
                    isDisabled={!insight.repository.isMissing && insight.viewerPermission !== 'ADMIN'}
                  >
                    <Icon as={iconFactory('trash')} mr="0.5rem" />
                    Delete {titleize(insight.itemType)}
                  </MenuItem>
                </MenuGroup>
              </>
            )}
          </MenuList>
        </Menu>
      </HStack>

      <RouterLink to={`/${insight.itemType}/${insight.fullName}/edit`}>
        <Button width={{ base: '100%', md: 'unset' }} variant="frost" isDisabled={!canEdit}>
          Edit
        </Button>
      </RouterLink>

      <CloneDialog insight={insight} isOpen={isCloneOpen} onClone={onClone} onClose={onCloneClose} />

      <DeleteDialog insight={insight} isOpen={isDeleteOpen} onDelete={onDelete} onClose={onDeleteClose} />

      <InsightCollaboratorsModal insightId={insight.id} isOpen={isCollaboratorsOpen} onClose={onCollaboratorsClose} />
    </>
  );
};
