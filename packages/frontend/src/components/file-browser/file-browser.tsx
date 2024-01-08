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
import { useColorModeValue } from '@chakra-ui/react';
import {
  Badge,
  Box,
  Collapse,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  HStack,
  IconButton,
  Tooltip,
  useDisclosure,
  VStack
} from '@chakra-ui/react';
import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

import type { FileOrFolder, InsightFile, InsightFolder } from '../../models/file-tree';
import { fileIconFactoryAs } from '../../shared/file-icon-factory';
import type { InsightFileTree } from '../../shared/file-tree';
import { isFolder } from '../../shared/file-tree';
import { iconFactoryAs } from '../../shared/icon-factory';
import { useFilePicker } from '../../shared/use-file-picker';

import { EditableControls } from './components/editable-controls/editable-controls';

type FileOrFolderSelect = (fileOrFolder: FileOrFolder) => void;

export type FileBrowserActions = {
  onDelete?: (fileOrFolder: FileOrFolder, force?: boolean) => void;
  onFilePicker?: () => void;
  onMove?: (fileOrFolder: FileOrFolder, newPath: string) => void;
  onNewFile?: (parent?: InsightFolder) => void;
  onNewFolder?: (parent?: InsightFolder) => void;
  onRename?: (fileOrFolder: FileOrFolder, newName: string) => void;
  onSelect?: (fileOrFolder: FileOrFolder | undefined) => void;
  onUndelete?: (fileOrFolder: FileOrFolder) => void;
  onUpload?: (acceptedFiles: any[], parent?: InsightFolder) => void;
};

type RendererProps = BoxProps & {
  indent: number;
  selected: FileOrFolder | undefined;
  onFileSelect: FileOrFolderSelect;
  actions: FileBrowserActions;
};

const FileTreeRenderer = ({
  actions,
  indent,
  onFileSelect,
  selected,
  treeItems,
  ...boxProps
}: { treeItems: FileOrFolder[] } & RendererProps) => {
  return (
    <Box {...boxProps}>
      {treeItems.map((item) =>
        isFolder(item) ? (
          <FolderRenderer
            key={item.id}
            item={item}
            onFileSelect={onFileSelect}
            selected={selected}
            actions={actions}
            indent={indent}
          />
        ) : (
          <FileRenderer
            key={item.id}
            item={item}
            onFileSelect={onFileSelect}
            selected={selected}
            actions={actions}
            indent={indent}
          />
        )
      )}
    </Box>
  );
};

const FolderRenderer = ({
  actions,
  indent = 0,
  item,
  onFileSelect,
  selected
}: { indent: number; item: InsightFolder } & RendererProps) => {
  const { isOpen, onOpen, onToggle } = useDisclosure();
  const isSelected = selected?.id === item.id;
  const isDeleted = item.action === 'delete';

  const [name, setName] = useState(item.name);

  const onRename = (newName: string) => {
    // If empty, reset to original name
    if (newName === '') {
      // If never had a name, delete it
      if (item.name === '' && actions.onDelete) {
        actions.onDelete(item, true);
        return;
      }

      // Reset to original name
      setName(item.name);
    }

    if (actions.onRename) {
      actions.onRename(item, newName);
    }
  };

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
            if (actions.onUpload) {
              actions.onUpload(droppedItem.files, item);
              onOpen();
            }
            break;
          }

          case 'file': {
            // Move file to new location in tree
            if (actions.onMove) {
              actions.onMove(droppedItem, `${item.path}/${droppedItem.name}`);
              onOpen();
            }
          }
        }
      },
      collect: (monitor) => ({
        isDragOver: monitor.isOver({ shallow: true })
      })
    }),
    [actions.onMove, item]
  );

  const [openFilePicker] = useFilePicker({
    onFilesPicked: (files) => {
      if (actions.onUpload) {
        actions.onUpload(files, item);
        onOpen();
      }
    }
  });

  const dragBgColor = useColorModeValue('snowstorm.200', 'polar.100');
  const dragBorderColor = useColorModeValue('polar.200', 'snowstorm.100');
  const selectedBgColor = useColorModeValue('snowstorm.300', 'polar.300');

  return (
    <Flex
      key={item.id}
      flexDirection="column"
      ref={drop}
      {...(isDragOver && {
        bg: dragBgColor,
        borderWidth: '1px',
        borderStyle: 'dashed',
        borderColor: dragBorderColor
      })}
    >
      <Box bg={isSelected ? selectedBgColor : 'transparent'} fontWeight={isSelected ? 'bold' : 'unset'}>
        <Editable
          as={Flex}
          value={name}
          onChange={setName}
          onSubmit={onRename}
          placeholder="<Folder>"
          isDisabled={item.readonly || isDeleted}
          startWithEditView={item.name === ''}
          isPreviewFocusable={false}
          minW={0}
          maxW="100%"
          px="1rem"
          ml={`${indent * 1.5}rem`}
          justify="space-between"
          align="center"
          minHeight="32px"
          onClick={() => {
            onToggle();
            onFileSelect(item);
          }}
          _hover={item.readonly ? {} : { '& > .actions': { display: 'flex' } }}
        >
          {fileIconFactoryAs(
            {
              mimeType: undefined,
              fileName: item.name,
              isFolder: true,
              isOpen,
              isSelected
            },
            { fontSize: '1rem', mr: '0.5rem' }
          )}
          <EditablePreview
            textDecoration={isDeleted ? 'line-through' : 'none'}
            color={isDeleted ? 'gray.400' : 'unset'}
            minW={0}
            maxW="100%"
            flexGrow={2}
            noOfLines={1}
          />
          {item.readonly && <Badge>readonly</Badge>}
          <EditableInput />

          <EditableControls
            actions={{ ...actions, onFilePicker: openFilePicker }}
            isDeleted={isDeleted}
            isDisabled={item.readonly}
            item={item}
            onOpen={onOpen}
            selected={selected}
          />
        </Editable>
      </Box>

      <Collapse in={isOpen} animateOpacity>
        <FileTreeRenderer
          treeItems={item.tree}
          onFileSelect={onFileSelect}
          selected={selected}
          actions={actions}
          indent={indent + 1}
        />
      </Collapse>
    </Flex>
  );
};

const FileRenderer = ({
  actions,
  indent = 0,
  item,
  onFileSelect,
  selected
}: { indent: number; item: InsightFile } & RendererProps) => {
  const { isOpen, onOpen, onToggle } = useDisclosure();
  const isSelected = selected?.id === item.id;
  const isDeleted = item.action === 'delete';

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'file',
    item: () => item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: () => !item.readonly
  }));

  const [name, setName] = useState(item.name);

  const onRename = (newName: string) => {
    // If empty, reset to original name
    if (newName === '') {
      // If never had a name, delete it
      if (item.name === '' && actions.onDelete) {
        actions.onDelete(item, true);
        return;
      }

      // Reset to original name
      setName(item.name);
    }

    if (actions.onRename) {
      actions.onRename(item, newName);
    }
  };

  const selectedBgColor = useColorModeValue('snowstorm.300', 'polar.300');

  return (
    <Box
      ref={drag}
      key={item.id}
      bg={isSelected ? selectedBgColor : 'transparent'}
      fontWeight={isSelected ? 'bold' : 'unset'}
      cursor="pointer"
      {...(isDragging && {
        opacity: 0.5,
        cursor: 'move'
      })}
    >
      <Editable
        as={Flex}
        value={name}
        onChange={setName}
        onSubmit={onRename}
        placeholder="<File>"
        isDisabled={item.readonly || isDeleted}
        startWithEditView={item.name === ''}
        isPreviewFocusable={false}
        minW={0}
        maxW="100%"
        px="1rem"
        ml={`${indent * 1.5}rem`}
        justify="space-between"
        align="center"
        minHeight="32px"
        onClick={() => {
          onFileSelect(item);
        }}
        _hover={item.readonly ? {} : { '& > .actions': { display: 'flex' } }}
      >
        {fileIconFactoryAs(
          {
            mimeType: item.mimeType,
            fileName: item.name,
            isFolder: false,
            isOpen,
            isSelected
          },
          { fontSize: '1rem', mr: '0.5rem' }
        )}
        <EditablePreview
          textDecoration={isDeleted ? 'line-through' : 'none'}
          color={isDeleted ? 'gray.400' : 'unset'}
          minW={0}
          maxW="100%"
          flexGrow={2}
          noOfLines={1}
          cursor="unset"
        />
        {item.readonly && <Badge>readonly</Badge>}
        <EditableInput />

        <EditableControls
          actions={actions}
          isDeleted={isDeleted}
          isDisabled={item.readonly}
          item={item}
          onOpen={onOpen}
          selected={selected}
        />
      </Editable>
    </Box>
  );
};

interface Props {
  tree: InsightFileTree;
  actions?: FileBrowserActions;
  isUploading?: boolean;
}

export const FileBrowser = ({ actions = {}, isUploading, tree, ...boxProps }: Props & BoxProps) => {
  const [selected, setSelected] = useState<FileOrFolder>();

  const onFileSelect = (selected: FileOrFolder) => {
    setSelected(selected);
    if (actions.onSelect) {
      actions.onSelect(selected);
    }
  };

  const [openFilePicker] = useFilePicker({
    onFilesPicked: (files) => {
      if (actions.onUpload) {
        actions.onUpload(files, undefined);
      }
    }
  });

  const dragBgColor = useColorModeValue('snowstorm.200', 'polar.100');
  const dragBorderColor = useColorModeValue('polar.200', 'snowstorm.300');

  return (
    <VStack align="stretch" fontSize="sm" {...boxProps}>
      <HStack spacing="0.25rem" justify="flex-end" pr="1rem">
        <Tooltip label="Upload File" aria-label="Upload File">
          <IconButton
            variant="ghost"
            size="sm"
            _hover={{ backgroundColor: 'aurora.400' }}
            aria-label="Upload File"
            icon={iconFactoryAs('upload')}
            isLoading={isUploading}
            onClick={openFilePicker}
          />
        </Tooltip>
        <Tooltip label="New File" aria-label="New File">
          <IconButton
            variant="ghost"
            size="sm"
            _hover={{ backgroundColor: 'aurora.400' }}
            aria-label="New File"
            icon={iconFactoryAs('newFile')}
            onClick={() => {
              if (actions.onNewFile) {
                actions.onNewFile();
              }
            }}
          />
        </Tooltip>
        <Tooltip label="New Folder" aria-label="New Folder">
          <IconButton
            variant="ghost"
            size="sm"
            _hover={{ backgroundColor: 'aurora.400' }}
            aria-label="New Folder"
            icon={iconFactoryAs('newFolder')}
            onClick={() => {
              if (actions.onNewFolder) {
                actions.onNewFolder();
              }
            }}
          />
        </Tooltip>
      </HStack>
      <FileTreeRenderer
        treeItems={tree.getFiles()}
        selected={selected}
        onFileSelect={onFileSelect}
        actions={actions}
        indent={0}
      />
    </VStack>
  );
};
