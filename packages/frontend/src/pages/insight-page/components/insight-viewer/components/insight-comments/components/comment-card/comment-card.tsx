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

import { Avatar, Box, Flex, HStack, IconButton, Text, Tooltip, StackDivider, VStack } from '@chakra-ui/react';
import { DateTime } from 'luxon';
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { LikeButton } from '../../../../../../../../components/like-button/like-button';
import { LikedByTooltip } from '../../../../../../../../components/liked-by-tooltip/liked-by-tooltip';
import { Link } from '../../../../../../../../components/link/link';
import { MarkdownContainer } from '../../../../../../../../components/markdown-container/markdown-container';
import { Comment, User } from '../../../../../../../../models/generated/graphql';
import { formatDateIntl } from '../../../../../../../../shared/date-utils';
import { iconFactoryAs } from '../../../../../../../../shared/icon-factory';
import { RootState } from '../../../../../../../../store/store';
import { ReplyCard } from '../reply-card/reply-card';

interface Props {
  comment: Comment;
  onDelete: (commentId: string) => Promise<boolean>;
  onEdit: (commentId: string, comment: Partial<Comment>) => Promise<boolean>;
  onFetchLikedBy: (commentId: string) => Promise<User[]>;
  onSubmit: (comment: Partial<Comment>) => Promise<boolean>;
  onLike: (commentId: string, liked: boolean) => Promise<boolean>;
  nestReplies: boolean;
  bubbleReply?: (isBubble?: boolean) => void;
}

export const CommentCard = ({
  bubbleReply,
  comment,
  nestReplies,
  onDelete,
  onEdit,
  onFetchLikedBy,
  onLike,
  onSubmit
}: Props) => {
  const { loggedIn } = useSelector((state: RootState) => state.user);
  const [isEditing, setEditing] = useState(false);
  const [isReplying, setReplying] = useState(false);

  const replyRef = useRef<HTMLInputElement>(null);

  const toggleEditing = () => {
    setEditing(!isEditing);
    setReplying(false);
  };

  const toggleReplying = (isBubble = false) => {
    if (nestReplies) {
      if (isBubble) {
        if (!isReplying) {
          // User might bubble replies from different children, so only enable instead of toggle
          setReplying(true);
        }
      } else {
        setReplying(!isReplying);
      }

      setEditing(false);

      if (!isReplying && replyRef.current) {
        replyRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    } else if (bubbleReply) {
      bubbleReply(true);
    }
  };

  const editLabel = isEditing ? 'Cancel editing' : 'Edit this comment';
  const replyLabel = isReplying ? 'Cancel reply' : 'Reply to this comment';
  const likeLabel = comment.viewerHasLiked ? 'Unlike this comment' : 'Like this comment';

  const { isOwnComment } = comment;
  const childComments = comment?.childComments?.edges.map((e) => e.node) || [];

  const handleEdit = async (updatedComment) => {
    const result = await onEdit(comment.id, updatedComment);

    if (result === true) {
      setEditing(false);
    }
  };

  const handleReply = async (replyComment) => {
    const result = await onSubmit(replyComment);

    if (result === true) {
      setReplying(false);
    }
  };

  const toggleLike = async (liked: boolean) => {
    return onLike(comment.id, liked);
  };

  return (
    <VStack spacing="1rem" align="stretch">
      <HStack align="center">
        <Avatar name={comment.author?.displayName} size="sm" />

        <Link to={`/profile/${comment.author?.userName}`}>
          <Text fontWeight="bold" fontSize="md">
            {comment.author?.displayName}
          </Text>
        </Link>
        <Text color="polar.600" fontSize="sm">
          {formatDateIntl((comment.createdAt as unknown) as string, DateTime.DATETIME_MED)}
          {comment.isEdited && (
            <Tooltip label="This comment was edited" aria-label="This comment was edited">
              {' (edited)'}
            </Tooltip>
          )}
        </Text>

        <HStack spacing="0.25rem" flexGrow={1} justify="flex-end" align="center">
          {isOwnComment && (
            <Tooltip placement="bottom" label={editLabel} aria-label={editLabel}>
              <IconButton
                variant="ghost"
                color="polar.600"
                aria-label={editLabel}
                icon={isEditing ? iconFactoryAs('cancel') : iconFactoryAs('edit')}
                onClick={toggleEditing}
              />
            </Tooltip>
          )}

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
              disabled={isOwnComment}
            />
          </LikedByTooltip>

          <Tooltip placement="bottom" label={replyLabel} aria-label={replyLabel}>
            <IconButton
              variant="ghost"
              color="polar.600"
              aria-label={replyLabel}
              icon={isReplying ? iconFactoryAs('cancel') : iconFactoryAs('reply')}
              onClick={() => toggleReplying(false)}
              isDisabled={!loggedIn}
            />
          </Tooltip>
        </HStack>
      </HStack>

      {!isEditing && <MarkdownContainer contents={comment.commentText} />}

      {isEditing && (
        <ReplyCard
          isEditing={true}
          defaultValue={comment.commentText}
          onSubmit={handleEdit}
          onDelete={() => onDelete(comment.id)}
          isSubmitting={false}
        />
      )}

      {(isReplying || childComments.length > 0) && (
        <Flex direction="column" pl="1rem">
          <VStack
            spacing="1rem"
            align="stretch"
            pl="1rem"
            borderLeft="1px solid"
            borderColor="snowstorm.100"
            divider={<StackDivider borderColor="snowstorm.100" />}
          >
            {childComments.map((comment: Comment) => {
              return (
                <CommentCard
                  comment={comment}
                  key={comment.id}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onFetchLikedBy={onFetchLikedBy}
                  onSubmit={onSubmit}
                  onLike={onLike}
                  nestReplies={false}
                  bubbleReply={toggleReplying}
                />
              );
            })}

            {nestReplies && isReplying && (
              <ReplyCard
                replyTo={comment}
                onSubmit={handleReply}
                onDelete={() => onDelete(comment.id)}
                isSubmitting={false}
              />
            )}
          </VStack>

          {/* Just a scroll target */}
          <Box height={0} ref={replyRef} />
        </Flex>
      )}
    </VStack>
  );
};
