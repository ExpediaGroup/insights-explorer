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

import type { FileOrFolder, InsightFolder } from '../../models/file-tree';
import { fileIconFactoryAs } from '../../shared/file-icon-factory';
import type { InsightFileTree } from '../../shared/file-tree';
import { isFolder } from '../../shared/file-tree';
import { iconFactoryAs } from '../../shared/icon-factory';
import { DeleteIconButton } from '../delete-icon-button/delete-icon-button';

type FileOrFolderSelect = (fileOrFolder: FileOrFolder) => void;

export type FileBrowserActions = {
  onDelete?: (fileOrFolder: FileOrFolder, force?: boolean) => void;
  onNewFile?: (parent?: InsightFolder) => void;
  onNewFolder?: (parent?: InsightFolder) => void;
  onRename?: (fileOrFolder: FileOrFolder, newName: string) => void;
  onSelect?: (fileOrFolder: FileOrFolder | undefined) => void;
  onUndelete?: (fileOrFolder: FileOrFolder) => void;
};

type RendererProps = BoxProps & {
  indent: number;
  selected: FileOrFolder | undefined;
  onFileSelect: FileOrFolderSelect;
  actions: FileBrowserActions;
};

const EditableControls = ({ actions, isDeleted, isDisabled, item, onOpen, selected }) => {
  const { isEditing, getEditButtonProps } = useEditableControls();

  return (
    <HStack ml="0.25rem" spacing="0.25rem" display="none" className="actions">
      {isDeleted && (
        <Tooltip label="Undelete" aria-label="Undelete">
          <Button
            aria-label="Undelete"
            variant="ghost"
            size="sm"
            leftIcon={iconFactoryAs('undo')}
            onClick={() => {
              if (selected && actions.onUndelete) {
                actions.onUndelete(selected);
              }
            }}
          >
            Undelete
          </Button>
        </Tooltip>
      )}
      {!isDeleted && !isEditing && !item.readonly && (
        <>
          <Tooltip label="Rename" aria-label="Rename">
            <IconButton
              variant="ghost"
              size="sm"
              _hover={{ backgroundColor: 'snowstorm.100' }}
              aria-label="Rename"
              icon={iconFactoryAs('edit')}
              {...getEditButtonProps()}
            />
          </Tooltip>

          {isFolder(item) && (
            <>
              <Tooltip label="New File" aria-label="New File">
                <IconButton
                  variant="ghost"
                  size="sm"
                  _hover={{ backgroundColor: 'aurora.400' }}
                  aria-label="New File"
                  icon={iconFactoryAs('newFile')}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (actions.onNewFile) {
                      actions.onNewFile(item);
                      onOpen();
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (actions.onNewFolder) {
                      actions.onNewFolder(item);
                      onOpen();
                    }
                  }}
                />
              </Tooltip>
            </>
          )}
          <DeleteIconButton
            onClick={() => {
              if (actions.onDelete) {
                actions.onDelete(item);
              }
            }}
            isDisabled={item.readonly}
          />
        </>
      )}
    </HStack>
  );
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
      {treeItems.map((item) => (
        <FileOrFolderRenderer
          key={item.id}
          item={item}
          onFileSelect={onFileSelect}
          selected={selected}
          actions={actions}
          indent={indent}
        />
      ))}
    </Box>
  );
};

const FileOrFolderRenderer = ({
  actions,
  indent = 0,
  item,
  onFileSelect,
  selected
}: { indent: number; item: FileOrFolder } & RendererProps) => {
  const { isOpen, onOpen, onToggle } = useDisclosure();
  const isSelected = selected?.id === item.id;
  const isFolder2 = isFolder(item);
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

  return (
    <Flex key={item.id} flexDirection="column">
      <Box bg={isSelected ? 'snowstorm.300' : 'transparent'} fontWeight={isSelected ? 'bold' : 'unset'}>
        <Editable
          as={Flex}
          value={name}
          onChange={setName}
          onSubmit={onRename}
          placeholder={isFolder2 ? '<Folder>' : '<File>'}
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
            if (isFolder2) {
              onToggle();
            }
            onFileSelect(item);
          }}
          _hover={item.readonly ? {} : { '& > .actions': { display: 'flex' } }}
        >
          {fileIconFactoryAs(
            {
              mimeType: isFolder(item) ? undefined : item.mimeType,
              fileName: item.name,
              isFolder: isFolder2,
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

      {isFolder(item) && (
        <Collapse in={isOpen} animateOpacity>
          <FileTreeRenderer
            treeItems={item.tree}
            onFileSelect={onFileSelect}
            selected={selected}
            actions={actions}
            indent={indent + 1}
          />
        </Collapse>
      )}
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

  return (
    <VStack align="stretch" fontSize="sm" {...boxProps}>
      <HStack spacing="0.25rem" justify="flex-end" pr="1rem">
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
