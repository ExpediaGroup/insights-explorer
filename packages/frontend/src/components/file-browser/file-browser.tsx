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
  Button,
  Collapse,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  HStack,
  IconButton,
  Tooltip,
  useDisclosure,
  useEditableControls,
  VStack
} from '@chakra-ui/react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

import type { FileOrFolder, InsightFile, InsightFolder } from '../../models/file-tree';
import { fileIconFactoryAs } from '../../shared/file-icon-factory';
import type { InsightFileTree } from '../../shared/file-tree';
import { isFolder } from '../../shared/file-tree';
import { iconFactoryAs } from '../../shared/icon-factory';
import { DeleteIconButton } from '../delete-icon-button/delete-icon-button';

import { EditableControls } from './components/editable-controls/editable-controls';

type FileOrFolderSelect = (fileOrFolder: FileOrFolder) => void;

export type FileBrowserActions = {
  onDelete?: (fileOrFolder: FileOrFolder, force?: boolean) => void;
  onNewFile?: (parent?: InsightFolder) => void;
  onNewFolder?: (parent?: InsightFolder) => void;
  onRename?: (fileOrFolder: FileOrFolder, newName: string) => void;
  onSelect?: (fileOrFolder: FileOrFolder | undefined) => void;
  onUndelete?: (fileOrFolder: FileOrFolder) => void;
  onFilePicker?: () => void;
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

  const {
    getInputProps,
    getRootProps,
    isDragActive,
    open: openFilePicker
  } = useDropzone({
    onDrop: (acceptedFiles, rejectedFile, event) => {
      event.stopPropagation();
      if (actions.onUpload) {
        actions.onUpload(acceptedFiles, item);
      }
    },
    noClick: true,
    noDragEventsBubbling: true
  });

  const dragBgColor = useColorModeValue('snowstorm.200', 'polar.100');
  const dragBorderColor = useColorModeValue('polar.200', 'snowstorm.100');
  const selectedBgColor = useColorModeValue('snowstorm.300', 'polar.300');

  return (
    <Flex
      key={item.id}
      flexDirection="column"
      {...(isDragActive && {
        bg: dragBgColor,
        borderWidth: '1px',
        borderStyle: 'dashed',
        borderColor: dragBorderColor
      })}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
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
            isTruncated={true}
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
    <Flex key={item.id} flexDirection="column">
      <Box bg={isSelected ? selectedBgColor : 'transparent'} fontWeight={isSelected ? 'bold' : 'unset'}>
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
            isTruncated={true}
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
    </Flex>
  );
};

interface Props {
  tree: InsightFileTree;
  actions?: FileBrowserActions;
}

export const FileBrowser = ({ tree, actions = {}, ...boxProps }: Props & BoxProps) => {
  const [selected, setSelected] = useState<FileOrFolder>();

  const onFileSelect = (selected: FileOrFolder) => {
    setSelected(selected);
    if (actions.onSelect) {
      actions.onSelect(selected);
    }
  };

  const {
    getInputProps,
    getRootProps,
    isDragActive,
    open: openFilePicker
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (actions.onUpload) {
        actions.onUpload(acceptedFiles, undefined);
      }
    },
    noClick: true
  });

  return (
    <VStack align="stretch" fontSize="sm" {...boxProps} {...getRootProps()}>
      <HStack spacing="0.25rem" justify="flex-end" pr="1rem">
        <input {...getInputProps()} />
        <Tooltip label="Upload File" aria-label="Upload File">
          <IconButton
            variant="ghost"
            size="sm"
            _hover={{ backgroundColor: 'aurora.400' }}
            aria-label="Upload File"
            icon={iconFactoryAs('upload')}
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
