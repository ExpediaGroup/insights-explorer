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

import { Flex, StackDivider, Text, useToast, VStack } from '@chakra-ui/react';
import { gql, useMutation } from 'urql';

import { User } from '../../../../../../models/generated/graphql';
import { Comment } from '../../../../../../models/generated/graphql';
import { useLikedBy } from '../../../../../../shared/useLikedBy';
import { ProfileCommentCard } from '../profile-comment-card/profile-comment-card';

const COMMENT_FRAGMENT = gql`
  fragment CommentFields on Comment {
    id
    commentText
    createdAt
    isEdited
    isDeleted
    isOwnComment
    viewerHasLiked
    likeCount
    author {
      id
      userName
      displayName
      email
    }
    childComments {
      edges {
        node {
          id
          commentText
          createdAt
          isEdited
          isDeleted
          isOwnComment
          viewerHasLiked
          likeCount
          author {
            id
            userName
            displayName
            email
          }
        }
      }
    }
  }
`;

const LIKE_COMMENT_MUTATION = gql`
  ${COMMENT_FRAGMENT}
  mutation LikeComment($commentId: ID!, $liked: Boolean!) {
    likeComment(commentId: $commentId, liked: $liked) {
      ...CommentFields
    }
  }
`;

interface Props {
  user: User;
}

export const UserComments = ({ user }: Props) => {
  const toast = useToast();

  const comments = user.userComments?.edges.map((e) => e.node) || [];
  const totalComments = user.userComments?.pageInfo?.total || 0;

  const [, likeComment] = useMutation(LIKE_COMMENT_MUTATION);

  const onLike = async (commentId: string, liked: boolean): Promise<boolean> => {
    console.log('Liking comment:', commentId);
    const { error } = await likeComment({
      commentId,
      liked
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to like comment.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
      return false;
    }

    return true;
  };

  const { onFetchLikedBy } = useLikedBy('comment');

  return (
    <VStack spacing="1rem" p="1rem" pt={0} align="stretch" divider={<StackDivider borderColor="snowstorm.100" />}>
      <Flex mb="0.5rem">
        <Text textTransform="uppercase" fontSize="sm" fontWeight="bold" color="polar.600">
          {totalComments} result{totalComments > 1 && 's'}
        </Text>
      </Flex>
      {comments.map((comment: Comment) => {
        return (
          <ProfileCommentCard
            comment={comment}
            displayName={user.displayName}
            key={comment.id}
            userName={user.userName}
            onFetchLikedBy={onFetchLikedBy}
            onLike={onLike}
          />
        );
      })}
    </VStack>
  );
};
