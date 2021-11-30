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

import { Button, FormControl, Heading, HStack, Textarea, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Comment } from '../../../../../../../../models/generated/graphql';

import { DeleteCommentButton } from './delete-comment-button';

interface Props {
  isEditing?: boolean;
  defaultValue?: string;
  onSubmit: (values) => void | Promise<any>;
  onDelete?: () => Promise<boolean>;
  isSubmitting: boolean;
  replyTo?: Comment;
}

export const ReplyCard = ({ isEditing = false, defaultValue, onDelete, onSubmit, isSubmitting, replyTo }: Props) => {
  const form = useForm();
  const { handleSubmit, register } = form;

  const [isDeleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (onDelete) {
      setDeleting(true);
      await onDelete();
      setDeleting(false);
    }
  };

  return (
    <VStack as="form" onSubmit={handleSubmit(onSubmit)} spacing="1rem" align="stretch">
      {replyTo && (
        <>
          <input type="hidden" {...register('parentCommentId')} value={replyTo.id} />
          <Heading as="h5" size="sm">
            Replying to {replyTo.author?.displayName}
          </Heading>
        </>
      )}
      <FormControl>
        <Textarea
          id="comment-text"
          defaultValue={defaultValue || ''}
          placeholder="Leave a comment"
          {...register('commentText', { required: true, maxLength: 1000 })}
        />
      </FormControl>
      <HStack align="stretch">
        <Button variant="frost" isLoading={isSubmitting} type="submit" flexGrow={1}>
          Submit
        </Button>
        {isEditing && <DeleteCommentButton onDelete={handleDelete} isDeleting={isDeleting} />}
      </HStack>
    </VStack>
  );
};
