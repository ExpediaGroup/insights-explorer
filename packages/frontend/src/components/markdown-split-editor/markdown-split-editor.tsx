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

import type { FlexProps } from '@chakra-ui/react';
import {
  Button,
  Code,
  Divider,
  Flex,
  Icon,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Stack,
  Text,
  Tooltip,
  Box,
  Checkbox,
  HStack
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { UploadSingleFileMutation } from '../../models/generated/graphql';
import { iconFactory, iconFactoryAs } from '../../shared/icon-factory';
import { useDebounce } from '../../shared/useDebounce';
import { Link } from '../link/link';
import { MarkdownContainer } from '../markdown-container/markdown-container';
import { MarkdownEditor } from '../markdown-editor/markdown-editor';

const CodeBlock = ({ children, ...props }) => {
  return (
    <Code fontSize="sm" {...props} p={0} m={0}>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>{children}</pre>
    </Code>
  );
};

const FormattingHelp = () => (
  <Popover placement="auto" isLazy>
    <PopoverTrigger>
      <Button variant="link" fontSize="sm">
        Formatting Help
      </Button>
    </PopoverTrigger>
    <PopoverContent zIndex={9000}>
      <PopoverArrow />
      <PopoverCloseButton />
      <PopoverHeader>Formatting Help</PopoverHeader>
      <PopoverBody>
        <Stack>
          <Text fontSize="sm">Insights Explorer uses Markdown for formatting. Here are the basics.</Text>

          <Link to="/help/markdown" color="frost.400" fontSize="sm">
            <Icon as={iconFactory('markdown')} boxSize="1.5rem" mt="-0.2rem" mr="0.25rem" />
            Complete Reference
          </Link>

          <Text fontSize="sm">First Level Header</Text>
          <CodeBlock># Introduction</CodeBlock>
          <Divider />
          <Text fontSize="sm">Second Level Header</Text>
          <CodeBlock>## Data Cleansing</CodeBlock>
          <Divider />
          <Text fontSize="sm">Paragraphs</Text>
          <CodeBlock>Add two new lines to start a new paragraph.{'\n\n'}Like this.</CodeBlock>
          <Divider />
          <Text fontSize="sm">Bold</Text>
          <CodeBlock>Do **not** hardcode passwords into your Insight.</CodeBlock>
          <Divider />
          <Text fontSize="sm">Emphasis</Text>
          <CodeBlock>_Do_ provide references, sources, and example code.</CodeBlock>
          <Divider />
          <Text fontSize="sm">Lists</Text>
          <CodeBlock>
            Tools used:{`\n`}- R Studio{`\n`}- Tableau{`\n`}- Qubole
          </CodeBlock>
          <Divider />
          <Text fontSize="sm">Code</Text>
          <CodeBlock>Inline code: `const pi = 3.14;`</CodeBlock>
          <CodeBlock>
            ```js{`\n`}
            {'// Multi-line code'}
            {`\n`}const pi = 3.14;{`\n`}```
          </CodeBlock>
          <Divider />
          <Text fontSize="sm">Links</Text>
          <CodeBlock>[Markdown Guide](/help/markdown).</CodeBlock>
          <Divider />
          <Text fontSize="sm">Images</Text>
          <CodeBlock>![data-flow-diagram](data-flow-diagram.png)</CodeBlock>
        </Stack>
      </PopoverBody>
    </PopoverContent>
  </Popover>
);

interface Props {
  baseAssetUrl?: string;
  baseLinkUrl?: string;
  contents: string;
  onChange: (updatedContents: string) => void;
  showFormattingHelp?: boolean;
  showPreview?: boolean;
  transformAssetUri?: ((uri: string, children?: ReactNode, title?: string, alt?: string) => string) | null;
  uploadFile?: (file: File, name: string) => Promise<UploadSingleFileMutation | undefined>;
}

export const MarkdownSplitEditor = ({
  baseAssetUrl,
  baseLinkUrl,
  contents,
  onChange,
  showFormattingHelp = true,
  showPreview = true,
  transformAssetUri,
  uploadFile,
  ...flexProps
}: Props & Omit<FlexProps, 'onChange'>) => {
  const [internalValue, setInternalValue] = useState(contents);
  const previousValueRef = useRef(contents);

  // Preview text is used to display the markdown preview
  const [previewText, setPreviewText] = useState(contents);

  const [isPreviewMode, setPreviewMode] = useState(false);

  const [scrollSync, setScrollSync] = useState(false);

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
      <HStack justify="flex-end" spacing="0.5rem">
        <Checkbox
          isChecked={scrollSync}
          onChange={() => setScrollSync(!scrollSync)}
          size="sm"
          color="frost.400"
          fontWeight={'medium'}
          display={{ base: 'none', xl: 'flex' }}
        >
          {'Enable Scroll Sync (experimental)'}
        </Checkbox>
        {showFormattingHelp && <FormattingHelp />}
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
      </HStack>
      <Flex direction="row" flexGrow={1} maxH={scrollSync ? '60vh' : '100%'} overflow="hidden">
        <Box
          position="relative"
          flexGrow={1}
          width="100%"
          display={{ base: isPreviewMode ? 'none' : 'block', xl: 'block' }}
        >
          <MarkdownEditor
            contents={contents}
            onContentsChange={setInternalValue}
            uploadFile={uploadFile}
            scrollSync={scrollSync}
          />
        </Box>
        {showPreview && (
          <MarkdownContainer
            p="1rem"
            contents={previewText}
            baseAssetUrl={baseAssetUrl}
            baseLinkUrl={baseLinkUrl}
            transformAssetUri={transformAssetUri}
            display={{ base: isPreviewMode ? 'block' : 'none', xl: 'block' }}
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
