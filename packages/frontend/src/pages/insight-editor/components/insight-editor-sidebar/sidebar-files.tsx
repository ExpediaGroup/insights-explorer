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
  Button,
  Box,
  Collapse,
  Flex,
  FlexProps,
  Icon,
  IconButton,
  Spinner,
  Text,
  useDisclosure,
  useMediaQuery,
  useToast,
  VStack,
  HStack
} from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import { useCallback, useState } from 'react';
import { gql } from 'urql';

import { FileBrowser } from '../../../../components/file-browser/file-browser';
import { FileUploadArea } from '../../../../components/file-upload-area/file-upload-area';
import { SidebarHeading } from '../../../../components/sidebar-heading/sidebar-heading';
import { FileOrFolder, InsightFile, InsightFileAction, InsightFolder } from '../../../../models/file-tree';
import { UploadSingleFileMutation } from '../../../../models/generated/graphql';
import { InsightFileTree } from '../../../../shared/file-tree';
import { iconFactory, iconFactoryAs } from '../../../../shared/icon-factory';
import { urqlClient } from '../../../../urql';

const UPLOAD_SINGLE_FILE_MUTATION = gql`
  mutation UploadSingleFile($draftKey: String!, $attachment: InsightFileUploadInput!, $file: Upload!) {
    uploadSingleFile(draftKey: $draftKey, attachment: $attachment, file: $file) {
      id
      name
      path
      mimeType
      size
    }
  }
`;

interface Props {
  draftKey: string;
  isNewInsight: boolean;
  onSelectFile: (f: InsightFile | undefined) => void;
  onTreeChanged: (tree: InsightFileTree) => void;
  tree: InsightFileTree;
}

export const SidebarFiles = ({
  draftKey,
  isNewInsight,
  onSelectFile,
  onTreeChanged,
  tree,
  ...flexProps
}: Props & FlexProps) => {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const onDropFile = useCallback(
    async (acceptedFiles: any[]) => {
      setUploading(true);
      const uploadedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          console.log(file);
          // Upload file to IEX storage
          const { data, error } = await urqlClient
            .mutation<UploadSingleFileMutation>(UPLOAD_SINGLE_FILE_MUTATION, {
              draftKey,
              attachment: {
                id: nanoid(),
                size: file.size
              },
              file: file
            })
            .toPromise();
          setUploading(false);

          if (error || data === undefined) {
            console.error(error);
            toast({
              position: 'bottom-right',
              title: 'Unable to upload file.',
              status: 'error',
              duration: 9000,
              isClosable: true
            });
            return undefined;
          }

          return {
            ...data.uploadSingleFile,
            action: InsightFileAction.ADD
          };
        })
      );

      // Add files (automatically dedupes)
      uploadedFiles.forEach((file) => {
        if (file !== undefined) {
          tree.addItem(file);
        }
      });

      // Bubble up change
      onTreeChanged(tree);
    },
    [draftKey, onTreeChanged, toast, tree]
  );

  const onDelete = (fileOrFolder: FileOrFolder, isDeleted: boolean, force: boolean) => {
    if (fileOrFolder.readonly === true) {
      return;
    }

    if (force) {
      tree.removeItem(fileOrFolder);
    } else {
      tree.updateItemById({
        id: fileOrFolder.id,
        action: isDeleted ? InsightFileAction.DELETE : undefined
      } as InsightFile);
    }

    onTreeChanged(tree);
  };

  const onRename = (fileOrFolder: FileOrFolder, newName: string) => {
    tree.updateItemById({
      id: fileOrFolder.id,
      name: newName,
      action: fileOrFolder.action ?? InsightFileAction.RENAME
    });
    onTreeChanged(tree);
  };

  const onNewFile = (parent?: InsightFolder) => {
    tree.addItem({
      id: nanoid(),
      action: InsightFileAction.MODIFY,
      name: '',
      path: parent ? `${parent.path}/` : '',
      contents: ''
    });

    onTreeChanged(tree);
  };

  const onNewFolder = (parent?: InsightFolder) => {
    tree.addItem({
      id: nanoid(),
      action: InsightFileAction.MODIFY,
      name: '',
      path: parent ? `${parent.path}/` : '',
      tree: []
    });

    onTreeChanged(tree);
  };

  const [isMobile] = useMediaQuery('(max-width: 768px)');

  const { isOpen: filesOpen, onToggle: onFilesToggle } = useDisclosure({ defaultIsOpen: !isMobile });

  return (
    <Flex direction="column" align="stretch" {...flexProps}>
      <HStack spacing="space-between" onClick={onFilesToggle}>
        <SidebarHeading p="1rem" pb={0}>
          Files
        </SidebarHeading>
        <IconButton
          size="sm"
          display={{ base: 'flex', sm: 'none' }}
          aria-label={'Expand/collapse'}
          variant="ghost"
          pt="1rem"
          icon={filesOpen ? iconFactoryAs('chevronUp') : iconFactoryAs('chevronDown')}
          title={filesOpen ? 'Collapse the files section' : 'Expand the files section'}
        />
      </HStack>
      <Collapse in={filesOpen} animateOpacity>
        <FileBrowser
          mt="-1.75rem"
          mb="1rem"
          tree={tree}
          actions={{
            onSelect: (f) => {
              // Ignore folders which have trees
              if (f === undefined || !('tree' in f)) {
                onSelectFile(f);
              }
            },
            onDelete: (f, force = false) => onDelete(f, true, force),
            onNewFile,
            onNewFolder,
            onRename,
            onUndelete: (f) => onDelete(f, false, false)
          }}
        />

        {uploading && (
          <VStack spacing="0.5rem" align="center">
            <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
            <Text>Uploading...</Text>
          </VStack>
        )}
        {!uploading && (
          <Box p="0.5rem">
            <FileUploadArea onDrop={onDropFile} display={{ base: 'none', md: 'flex' }} />
            <Button
              width={{ base: '100%', md: 'unset' }}
              display={{ base: 'flex', md: 'none' }}
              bg="blue.400"
              type="submit"
            >
              <Icon as={iconFactory('upload')} mr="0.5rem" />
              Upload File
            </Button>
            <Text as="em" fontSize="xs">
              Maximum file size is 100MB.
            </Text>
          </Box>
        )}
      </Collapse>
    </Flex>
  );
};
