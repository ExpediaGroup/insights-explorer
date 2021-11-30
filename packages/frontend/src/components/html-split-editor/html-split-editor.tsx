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

import { Flex, FlexProps, IconButton, Tooltip, Box } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

import { iconFactoryAs } from '../../shared/icon-factory';
import { useDebounce } from '../../shared/useDebounce';
import { CodeEditor } from '../code-editor/code-editor';

interface Props {
  contents: string;
  onChange: (updatedContents: string) => void;
  showPreview?: boolean;
}

export const HtmlSplitEditor = ({
  contents,
  onChange,
  showPreview = true,
  ...flexProps
}: Props & Omit<FlexProps, 'onChange'>) => {
  const [internalValue, setInternalValue] = useState(contents);
  const previousValueRef = useRef(contents);

  // Preview text is used to display the markdown preview
  const [previewText, setPreviewText] = useState(contents);

  const [isPreviewMode, setPreviewMode] = useState(false);

  // Overwrite internal state if external contents change
  useEffect(() => {
    setInternalValue(contents);
    setPreviewText(contents);
  }, [contents]);

  // Debounce value changes to avoid too-frequent updates
  useDebounce(
    () => {
      if (internalValue !== previousValueRef.current && internalValue !== contents) {
        // Send changed value to parent
        onChange(internalValue);
        previousValueRef.current = internalValue;

        // Update Markdown preview
        // Debounced to minimize re-rendering overhead
        setPreviewText(internalValue);
      }
    },
    25,
    [internalValue]
  );

  return (
    <Flex {...flexProps} direction="column">
      <Flex direction="row" justify="flex-end" pr="0.25rem">
        {showPreview && (
          <Box display={{ base: 'block', xl: 'none' }} ml="1rem">
            {isPreviewMode && (
              <Tooltip placement="bottom" label="Display editor" aria-label="Display editor">
                <IconButton
                  aria-label="Display editor"
                  size="sm"
                  icon={iconFactoryAs('code')}
                  onClick={() => setPreviewMode(false)}
                />
              </Tooltip>
            )}
            {!isPreviewMode && (
              <Tooltip placement="bottom" label="Display preview" aria-label="Display preview">
                <IconButton
                  aria-label="Display preview"
                  size="sm"
                  icon={iconFactoryAs('preview')}
                  onClick={() => setPreviewMode(true)}
                />
              </Tooltip>
            )}
          </Box>
        )}
      </Flex>
      <Flex direction="row" flexGrow={1}>
        <Box
          position="relative"
          flexGrow={1}
          width="100%"
          display={{ base: isPreviewMode ? 'none' : 'block', xl: 'block' }}
        >
          <CodeEditor contents={contents} language="xml" onContentsChange={setInternalValue} readOnly={false} />
        </Box>
        {showPreview && (
          <Box
            dangerouslySetInnerHTML={{ __html: previewText }}
            display={{ base: isPreviewMode ? 'block' : 'none', xl: 'block' }}
            padding="1rem"
            flex="1 0 50%"
            borderLeftWidth={{ base: 0, xl: '1px' }}
            borderLeftColor="gray.300"
            overflow="auto"
          />
        )}
      </Flex>
    </Flex>
  );
};
