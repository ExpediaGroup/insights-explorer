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
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Icon,
  Text,
  VStack
} from '@chakra-ui/react';
import { useRef, RefObject, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import titleize from 'titleize';

import { Insight } from '../../../../../../models/generated/graphql';
import { iconFactory } from '../../../../../../shared/icon-factory';

interface Props {
  insight: Insight;
  isOpen: boolean;
  onDelete: () => Promise<boolean>;
  onClose: () => void;
}

export const DeleteDialog = ({ insight, isOpen, onDelete, onClose }: Props) => {
  const cancelRef = useRef() as RefObject<HTMLButtonElement>;
  const [isDeleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const onDeleteInternal = async () => {
    setDeleting(true);
    const deleted = await onDelete();
    if (deleted) {
      navigate('/');
    } else {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog leastDestructiveRef={cancelRef} onClose={onClose} isOpen={isOpen}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader display="flex" alignItems="center">
            <Icon as={iconFactory('trash')} mr="0.5rem" />
            Delete {titleize(insight.itemType)}?
          </AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            <VStack spacing="0.5rem">
              <Text>
                If you delete this {titleize(insight.itemType)}, it will be removed from Insights Explorer and no longer
                accessible.
              </Text>
              <Text>
                The GitHub repository for the {titleize(insight.itemType)} will be archived rather than deleted. This
                will make it read-only on GitHub, and it can be manually recovered later if necessary.
              </Text>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={onDeleteInternal} ml={3} isLoading={isDeleting}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
