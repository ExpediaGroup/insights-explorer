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
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Tag,
  Text,
  useDisclosure,
  VStack
} from '@chakra-ui/react';
import type { RefObject } from 'react';
import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import titleize from 'titleize';

import { Alert } from '../../../../components/alert/alert';
import { ItemTypeIcon } from '../../../../components/item-type-icon/item-type-icon';
import { Linkify } from '../../../../components/linkify/linkify';
import { formatFormError } from '../../../../shared/form-utils';
import { getItemType } from '../../../../shared/item-type';
import type { DraftForm } from '../../draft-form';

interface Props {
  insight: any;
  isPublishing: boolean;
  isSavingDraft: boolean;
  form: UseFormReturn<DraftForm>;
  onDiscard: any;
  onRefresh: any;
}

export const InsightEditorHeader = ({ insight, isPublishing, isSavingDraft, form, onDiscard, onRefresh }: Props) => {
  const {
    control,
    register,
    formState: { errors }
  } = form;
  const navigate = useNavigate();

  // Delete Draft confirmation
  const { isOpen: isDiscardOpen, onOpen: onDiscardOpen, onClose: onDiscardClose } = useDisclosure();
  const cancelRef = useRef() as RefObject<HTMLButtonElement>;
  const [isDiscarding, setDiscarding] = useState(false);

  const insightName = useWatch({
    control,
    name: 'name',
    defaultValue: insight.name
  });

  const insightDescription = useWatch({
    control,
    name: 'description',
    defaultValue: insight.description
  });

  const itemType = useWatch({
    control,
    name: 'itemType',
    defaultValue: insight?.itemType
  });

  if (insight == null) {
    return <Box></Box>;
  }

  if (insight == null) {
    return <Box></Box>;
  }

  const canEdit = insight.viewerCanEdit || insight.id === undefined;

  const onDiscardInternal = async () => {
    setDiscarding(true);
    const discarded = await onDiscard();
    if (discarded) {
      navigate(insight.id ? `/${itemType}/${insight.fullName}` : '/');
    } else {
      setDiscarding(false);
    }
  };

  return (
    <>
      <Flex
        direction="column"
        align="stretch"
        p="0.5rem"
        borderColor="gray.300"
        borderWidth="1px"
        borderRadius="lg"
        borderBottomLeftRadius={0}
        borderBottomRightRadius={0}
      >
        <HStack align="center">
          <ItemTypeIcon itemType={itemType} fontSize={{ base: '2rem' }} />

          <Heading as="h1" size="lg" flexGrow={1}>
            {insightName || `New ${titleize(itemType)}`}
          </Heading>

          <Tag size="md" color="white" bg={getItemType(itemType).color}>
            Editing {titleize(itemType)}
          </Tag>
        </HStack>

        <Text mb="1rem">
          <Linkify>{insightDescription}</Linkify>
        </Text>

        {!canEdit && (
          <Alert status="warning">
            <HStack spacing="0.5rem" d="inline-flex" align="center" justify="space-between" flexGrow={2}>
              <Text>You don't have permission to publish changes to this Insight.</Text>
              <Button size="sm" bg="snowstorm.100" flexShrink={0} onClick={onRefresh}>
                Recheck
              </Button>
            </HStack>
          </Alert>
        )}

        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          wrap="wrap"
          py="0.5rem"
        >
          <FormControl
            id="commit-message"
            width="auto"
            flexGrow={1}
            isRequired
            isInvalid={errors.commitMessage !== undefined}
          >
            <FormLabel>Change Description</FormLabel>
            <Input
              placeholder="Updated via Insights Explorer"
              defaultValue={insight.commitMessage}
              {...register('commitMessage', { required: true })}
            />
            {errors.commitMessage === undefined && (
              <FormHelperText>Provide a meaningful description of the changes being made.</FormHelperText>
            )}
            <FormErrorMessage>{formatFormError(errors.commitMessage)}</FormErrorMessage>
          </FormControl>
          <Stack direction="row" align="stretch" mt={{ base: '0.5rem', md: 'unset' }}>
            <Button variant="link" px="1rem" p="0.5rem" width={{ base: '100%', md: 'unset' }} onClick={onDiscardOpen}>
              Discard
            </Button>
            <Button
              width={{ base: '100%', md: 'unset' }}
              bg="green.400"
              type="submit"
              isDisabled={!canEdit}
              isLoading={isPublishing || isSavingDraft}
            >
              Publish
            </Button>
          </Stack>
        </Flex>
      </Flex>

      <AlertDialog leastDestructiveRef={cancelRef} onClose={onDiscardClose} isOpen={isDiscardOpen}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Discard Draft?</AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              <VStack spacing="0.5rem" align="flex-start">
                <Text>Discarded drafts are deleted permenantly and cannot be resumed later.</Text>
                <Text>
                  If you want to keep the draft for future use, you can simply navigate to another page in Insights
                  Explorer without discarding the draft.
                </Text>
                <Text>Are you sure you want to discard this draft?</Text>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDiscardClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={onDiscardInternal} ml={3} isLoading={isDiscarding}>
                Discard
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};
