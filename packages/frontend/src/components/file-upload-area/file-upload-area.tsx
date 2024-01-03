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
import { Box, Button, Icon } from '@chakra-ui/react';
import type { Accept } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';

import { iconFactory } from '../../shared/icon-factory';

export const DROPZONE_ACCEPT_ALL_FILES = {};

interface Props {
  onDrop: any;
  accept?: Accept;
  element?: any;
  dragElement?: any;
}

const defaultElement = (
  <Box textAlign="center" padding="4rem">
    <p className="dropzone-content">Drag 'n' drop files here, or click to select files</p>
  </Box>
);

const defaultDragElement = (
  <Box textAlign="center" padding="4rem">
    <p className="dropzone-content">Release to drop the files here</p>
  </Box>
);

export const FileUploadArea = ({
  onDrop,
  accept = DROPZONE_ACCEPT_ALL_FILES,
  element,
  dragElement,
  ...props
}: Props & Omit<BoxProps, 'onDrop'>) => {
  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept
  });

  return (
    <>
      <Box
        {...getRootProps()}
        outline="none"
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={isDragActive ? 'green.200' : 'gray.100'}
        cursor="pointer"
        display={{ base: 'none', md: 'flex' }}
        {...props}
      >
        <input className="dropzone-input" {...getInputProps()} />
        {isDragActive ? dragElement ?? defaultDragElement : element ?? defaultElement}
      </Box>
      {/* mobile only */}
      <Button width={{ base: '100%', md: 'unset' }} display={{ base: 'flex', md: 'none' }} bg="blue.400" onClick={open}>
        <Icon as={iconFactory('upload')} mr="0.5rem" />
        Upload File
      </Button>
    </>
  );
};
