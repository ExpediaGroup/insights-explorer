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

import { useBreakpointValue } from '@chakra-ui/media-query';
import type { FlexProps } from '@chakra-ui/react';
import { useColorModeValue } from '@chakra-ui/react';
import { Progress } from '@chakra-ui/react';
import { Divider } from '@chakra-ui/react';
import { Box, Collapse, Flex, IconButton, Text, useToast, HStack } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import { useCallback, useState } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { gql } from 'urql';

import { FileBrowser } from '../../../../components/file-browser/file-browser';
import { SidebarHeading } from '../../../../components/sidebar-heading/sidebar-heading';
import type { FileOrFolder, InsightFile, InsightFolder } from '../../../../models/file-tree';
import { InsightFileAction } from '../../../../models/file-tree';
import type { UploadSingleFileMutation } from '../../../../models/generated/graphql';
import type { InsightFileTree } from '../../../../shared/file-tree';
import { iconFactoryAs } from '../../../../shared/icon-factory';
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
  isFilesOpen: boolean;
  isNewInsight: boolean;
  onFilesToggle: () => void;
  onSelectFile: (f: InsightFile | undefined) => void;
  onTreeChanged: (tree: InsightFileTree) => void;
  tree: InsightFileTree;
}

export const SidebarFiles = ({
  draftKey,
  isFilesOpen,
  isNewInsight,
  onFilesToggle,
  onSelectFile,
  onTreeChanged,
  tree,
  ...flexProps
}: Props & FlexProps) => {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const onUploadFile = useCallback(
    async (acceptedFiles: any[], item?: FileOrFolder) => {
      setUploading(true);
      const uploadedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          // Upload file to IEX storage
          const { data, error } = await urqlClient
            .mutation<UploadSingleFileMutation>(UPLOAD_SINGLE_FILE_MUTATION, {
              draftKey,
              attachment: {
                id: nanoid(),
                size: file.size,
                path: item ? `${item?.path}/${file.name}` : undefined
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

  const onMove = (fileOrFolder: FileOrFolder, newPath: string) => {
    tree.moveItem(fileOrFolder, newPath);
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

  const isMobile = useBreakpointValue({ base: true, md: false });

  const iconOption = useBreakpointValue({
    base: isFilesOpen ? iconFactoryAs('chevronUp') : iconFactoryAs('chevronDown'),
    md: isFilesOpen ? iconFactoryAs('chevronRight') : iconFactoryAs('folderOpened')
  });

  const [{ isDragOver }, drop] = useDrop<FileOrFolder | any, FileOrFolder, any>(
    () => ({
      accept: ['file', NativeTypes.FILE],
      drop: (droppedItem, monitor) => {
        if (monitor.didDrop()) {
          // Already dropped
          return undefined;
        }

        switch (monitor.getItemType()) {
          case NativeTypes.FILE: {
            // Upload file and add to tree
            onUploadFile(droppedItem.files, undefined);
            break;
          }

          case 'file': {
            // Move file to new location in tree
            onMove(droppedItem, droppedItem.name);
          }
        }
      },
      collect: (monitor) => ({
        isDragOver: monitor.isOver({ shallow: true })
      })
    }),
    []
  );

  const dragBgColor = useColorModeValue('snowstorm.200', 'polar.100');
  const dragBorderColor = useColorModeValue('polar.200', 'snowstorm.300');

  return (
    <Flex
      direction="column"
      align="stretch"
      flexGrow={1}
      ref={drop}
      {...(isDragOver && {
        bg: dragBgColor,
        borderWidth: '1px',
        borderStyle: 'dashed',
        borderColor: dragBorderColor
      })}
      {...flexProps}
    >
      <HStack spacing="space-between" onClick={onFilesToggle} align="center">
        <IconButton
          size="sm"
          display={{ base: 'flex', sm: 'flex' }}
          aria-label={'Expand/collapse'}
          variant="ghost"
          icon={iconOption}
          title={isFilesOpen ? 'Collapse the files section' : 'Expand the files section'}
        />
        {(isFilesOpen || isMobile) && <SidebarHeading p="0.5rem">Files</SidebarHeading>}
      </HStack>

      <Box mt={isFilesOpen ? '-2rem' : 'unset'}>
        <Collapse in={isFilesOpen || (!isMobile && isFilesOpen)} animateOpacity>
          <FileBrowser
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
              onMove,
              onNewFile,
              onNewFolder,
              onRename,
              onUndelete: (f) => onDelete(f, false, false),
              onUpload: onUploadFile
            }}
            isUploading={uploading}
          />

          {uploading && <Progress size="xs" isIndeterminate />}

          <Divider />

          <Box p="0.5rem">
            <Text as="em" fontSize="xs">
              Maximum file size is 100MB.
            </Text>
          </Box>
        </Collapse>
      </Box>
    </Flex>
  );
};
