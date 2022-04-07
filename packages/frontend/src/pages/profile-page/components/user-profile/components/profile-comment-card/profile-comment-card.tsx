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

import { HStack, Stack, Text, Tooltip, VStack } from '@chakra-ui/react';

import { ItemTypeIcon } from '../../../../../../components/item-type-icon/item-type-icon';
import { LikeButton } from '../../../../../../components/like-button/like-button';
import { LikedByTooltip } from '../../../../../../components/liked-by-tooltip/liked-by-tooltip';
import { Link } from '../../../../../../components/link/link';
import { MarkdownContainer } from '../../../../../../components/markdown-container/markdown-container';
import type { Comment, User } from '../../../../../../models/generated/graphql';
import { formatDateIntl, formatRelativeIntl } from '../../../../../../shared/date-utils';

interface Props {
  comment: Comment;
  userName: string;
  displayName: string;
  onFetchLikedBy: (commentId: string) => Promise<User[]>;
  onLike: (commentId: string, liked: boolean) => Promise<boolean>;
}

export const ProfileCommentCard = ({ comment, userName, displayName, onFetchLikedBy, onLike }: Props) => {
  const likeLabel = comment.viewerHasLiked ? 'Unlike this comment' : 'Like this comment';

  const toggleLike = async (liked: boolean) => {
    return onLike(comment.id, liked);
  };

  return (
    <VStack spacing="1rem" align="stretch">
      <Stack direction={{ base: 'column', md: 'row' }}>
        <Stack direction="row">
          {' '}
          <ItemTypeIcon itemType={comment?.insight.itemType ?? 'insight'} />
          <Link to={`/${comment?.insight.itemType}/${comment?.insight.fullName}`} display="inline-block">
            <Text fontWeight="bold" fontSize="md" display="inline-block">
              {comment?.insight.name}
            </Text>
          </Link>
        </Stack>

        <Tooltip
          label={formatDateIntl(comment.createdAt)}
          aria-label={`Occurred at ${formatDateIntl(comment.createdAt)}`}
        >
          <Text fontSize="sm" color="polar.600" flexShrink={0}>
            {formatRelativeIntl(comment.createdAt)}
          </Text>
        </Tooltip>

        <Text color="polar.600" fontSize="sm">
          {comment.isEdited && (
            <Tooltip label="This comment was edited" aria-label="This comment was edited">
              {' (edited)'}
            </Tooltip>
          )}
        </Text>

        <HStack spacing="0.25rem" flexGrow={1} justify="flex-end" align="center">
          <LikedByTooltip
            label={likeLabel}
            likeCount={comment.likeCount}
            onFetchLikedBy={() => onFetchLikedBy(comment.id)}
            placement="bottom"
          >
            <LikeButton
              label={likeLabel}
              liked={comment.viewerHasLiked}
              likeCount={comment.likeCount}
              onLike={toggleLike}
              disabled={comment.isOwnComment}
            />
          </LikedByTooltip>
        </HStack>
      </Stack>

      <MarkdownContainer contents={comment.commentText} />
    </VStack>
  );
};
