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
import { useRef, useState } from 'react';
import titleize from 'titleize';

import type { Insight } from '../../../../../../models/generated/graphql';
import { iconFactory } from '../../../../../../shared/icon-factory';

interface Props {
  insight: Insight;
  isOpen: boolean;
  onClone: () => Promise<boolean>;
  onClose: () => void;
}

export const CloneDialog = ({ insight, isOpen, onClone, onClose }: Props) => {
  const cancelRef = useRef(null);
  const [isCloning, setCloning] = useState(false);

  const onCloneInternal = async () => {
    setCloning(true);
    await onClone();
    setCloning(false);
    onClose();
  };

  return (
    <AlertDialog leastDestructiveRef={cancelRef} onClose={onClose} isOpen={isOpen}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader display="flex" alignItems="center">
            <Icon as={iconFactory('clone')} mr="0.5rem" />
            Clone {titleize(insight.itemType)}?
          </AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            <VStack spacing="0.5rem">
              <Text>
                Cloning creates a new draft containing all the files of this {titleize(insight.itemType)}. The draft can
                then be edited as needed and published as a new {titleize(insight.itemType)}.
              </Text>
              <Text>All files will be cloned into the new draft, but change history will not be copied over.</Text>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button variant="frost" onClick={onCloneInternal} ml={3} isLoading={isCloning}>
              Clone
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
