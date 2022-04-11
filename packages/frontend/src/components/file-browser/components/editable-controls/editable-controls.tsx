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

import { Button, HStack, IconButton, Tooltip, useEditableControls } from '@chakra-ui/react';

import { isFolder } from '../../../../shared/file-tree';
import { iconFactoryAs } from '../../../../shared/icon-factory';
import { DeleteIconButton } from '../../../delete-icon-button/delete-icon-button';

export const EditableControls = ({ actions, isDeleted, isDisabled, item, onOpen, selected }) => {
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
              <Tooltip label="Upload File" aria-label="Upload File">
                <IconButton
                  variant="ghost"
                  size="sm"
                  _hover={{ backgroundColor: 'aurora.400' }}
                  aria-label="Upload File"
                  icon={iconFactoryAs('upload')}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (actions.onFilePicker) {
                      actions.onFilePicker();
                    }
                  }}
                />
              </Tooltip>
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
