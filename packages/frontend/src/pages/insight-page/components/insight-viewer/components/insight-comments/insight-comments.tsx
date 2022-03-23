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

import type { BoxProps } from '@chakra-ui/react';
import { Center, Flex, Heading, HStack, Spinner, StackDivider, Text, useToast, VStack } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { gql, useMutation, useQuery } from 'urql';

import { Alert } from '../../../../../../components/alert/alert';
import { Card } from '../../../../../../components/card/card';
import { Crumbs } from '../../../../../../components/crumbs/crumbs';
import type { Comment, CommentConnection, Insight } from '../../../../../../models/generated/graphql';
import { useLikedBy } from '../../../../../../shared/useLikedBy';
import type { RootState } from '../../../../../../store/store';

import { CommentCard } from './components/comment-card/comment-card';
import { ReplyCard } from './components/reply-card/reply-card';

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

const COMMENTS_QUERY = gql`
  ${COMMENT_FRAGMENT}
  query FetchComments($insightId: ID!) {
    comments(insightId: $insightId) {
      edges {
        node {
          ...CommentFields
        }
      }
    }
  }
`;

const ADD_COMMENT_MUTATION = gql`
  ${COMMENT_FRAGMENT}
  mutation AddComment($comment: CommentInput!) {
    addComment(comment: $comment) {
      ...CommentFields
    }
  }
`;

const UPDATE_COMMENT_MUTATION = gql`
  ${COMMENT_FRAGMENT}
  mutation UpdateComment($commentId: ID!, $comment: CommentInput!) {
    updateComment(commentId: $commentId, comment: $comment) {
      ...CommentFields
    }
  }
`;

const DELETE_COMMENT_MUTATION = gql`
  ${COMMENT_FRAGMENT}
  mutation DeleteComment($commentId: ID!) {
    deleteComment(commentId: $commentId) {
      ...CommentFields
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
  insight: Insight;
  inline?: boolean;
}

/**
 * This component loads and renders Insight Comments.  It also handles
 * posting or editing new comments.
 *
 * This component handles loading its own data, since it needs to provide
 * paging/sorting/refreshing functionality.
 */
export const InsightComments = ({ insight, inline = false, ...props }: Props & BoxProps) => {
  const { loggedIn } = useSelector((state: RootState) => state.user);

  // Standalone mode is the opposite of inline mode.
  const standalone = !inline;

  const toast = useToast();

  const [{ data, error, fetching }, reexecuteQuery] = useQuery<{ comments: CommentConnection }>({
    query: COMMENTS_QUERY,
    variables: { insightId: insight.id }
  });

  const [{ fetching: addCommentFetching }, addComment] = useMutation(ADD_COMMENT_MUTATION);
  const [, updateComment] = useMutation(UPDATE_COMMENT_MUTATION);
  const [, deleteComment] = useMutation(DELETE_COMMENT_MUTATION);
  const [, likeComment] = useMutation(LIKE_COMMENT_MUTATION);

  const comments = data?.comments.edges.map((e) => e.node) || [];
  const commentsAvailable = comments.length > 0;

  const breadcrumbs = [
    { text: insight.name, link: `/${insight.itemType}/${insight.fullName}` },
    { text: 'Discussion', link: '#' }
  ];

  const onSubmit = async (comment): Promise<boolean> => {
    console.log('Creating new comment:', comment);
    const { error } = await addComment({
      comment: {
        insightId: insight.id,
        ...comment
      }
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to comment.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
      return false;
    }

    // Reload comments
    reexecuteQuery({ requestPolicy: 'network-only' });

    toast({
      position: 'bottom-right',
      title: 'Comment submitted!',
      status: 'success',
      duration: 3000,
      isClosable: true
    });

    return true;
  };

  const onEdit = async (commentId: string, comment): Promise<boolean> => {
    console.log('Editing comment:', comment);
    const { error } = await updateComment({
      commentId,
      comment
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to comment.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
      return false;
    }

    toast({
      position: 'bottom-right',
      title: 'Comment updated!',
      status: 'success',
      duration: 3000,
      isClosable: true
    });

    return true;
  };

  const onDelete = async (commentId: string): Promise<boolean> => {
    console.log('Deleting comment:', commentId);
    const { error } = await deleteComment({
      commentId
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to delete.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
      return false;
    }

    // Reload comments
    reexecuteQuery({ requestPolicy: 'network-only' });

    toast({
      position: 'bottom-right',
      title: 'Comment deleted!',
      status: 'success',
      duration: 3000,
      isClosable: true
    });

    return true;
  };

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
    <VStack spacing="1rem" align="stretch" {...props}>
      {standalone && (
        <Flex direction="row" align="center" p="0.5rem" height="50px">
          <Crumbs crumbs={breadcrumbs} />
        </Flex>
      )}

      {error && <Alert error={error} />}

      <VStack as={Card} spacing={0} align="stretch">
        <Heading p="1rem" fontSize="md" flexGrow={1}>
          {fetching && !commentsAvailable && (
            <HStack>
              <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="md" />
              <Text>Loading comments...</Text>
            </HStack>
          )}
          {!fetching && <>{insight.commentCount || 'No'} Comments</>}
        </Heading>

        {(!fetching || commentsAvailable) && (
          <VStack spacing="1rem" p="1rem" pt={0} align="stretch" divider={<StackDivider borderColor="snowstorm.100" />}>
            {comments.map((comment: Comment) => {
              return (
                <CommentCard
                  comment={comment}
                  key={comment.id}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onFetchLikedBy={onFetchLikedBy}
                  onSubmit={onSubmit}
                  onLike={onLike}
                  nestReplies={true}
                />
              );
            })}

            {loggedIn && <ReplyCard onSubmit={onSubmit} isSubmitting={addCommentFetching} />}
            {!loggedIn && (
              <Center height="5rem">
                <Text fontStyle="italic" color="polar.600">
                  Please log in to comment.
                </Text>
              </Center>
            )}
          </VStack>
        )}
      </VStack>
    </VStack>
  );
};
