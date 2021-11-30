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

import { Box, BoxProps, Collapse, HStack, IconButton, Code, useClipboard, useDisclosure } from '@chakra-ui/react';
import { memo, useEffect } from 'react';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { iconFactoryAs } from '../../../shared/icon-factory';
import { getLanguage } from '../../../shared/languages';

export interface CodeRendererProps {
  collapseButton?: boolean;
  contents?: string;
  copyButton?: boolean;
  defaultIsOpen?: boolean;
  language?: string;
  startingLineNumber?: number;
  style?: string;
  unstyled?: boolean;
}

export const CodeRenderer = memo(
  ({
    contents,
    language,
    startingLineNumber = 1,
    unstyled = false,
    copyButton = false,
    collapseButton = true,
    defaultIsOpen = true,
    ...boxProps
  }: CodeRendererProps & BoxProps) => {
    const { hasCopied, onCopy } = useClipboard(contents || '');
    const { isOpen, onClose, onOpen, onToggle } = useDisclosure({ defaultIsOpen });

    // With PrismLightAsync, refractor aliases don't work out of the box
    const effectiveLanguage = getLanguage(language);

    useEffect(() => {
      // If the default changes, apply the change
      if (defaultIsOpen) {
        onOpen();
      } else {
        onClose();
      }
    }, [defaultIsOpen, onClose, onOpen]);

    if (unstyled)
      return (
        <Box as="pre" width="100%" {...boxProps}>
          <Code bg="gray.50" width="100%" p="1rem" overflowX="auto" verticalAlign="top">
            {contents}
          </Code>
        </Box>
      );

    return (
      <Box position="relative" {...boxProps}>
        <HStack top="0.5rem" right="0.5rem" position="absolute">
          {copyButton && (
            <IconButton
              aria-label="Copy this code"
              icon={iconFactoryAs(hasCopied ? 'check' : 'clipboard')}
              variant="polar"
              size="sm"
              onClick={onCopy}
              title="Copy to the clipboard"
            />
          )}
          {collapseButton && (
            <IconButton
              aria-label="Expand/collapse"
              icon={isOpen ? iconFactoryAs('chevronUp') : iconFactoryAs('chevronDown')}
              variant="polar"
              size="sm"
              onClick={onToggle}
              title={isOpen ? 'Collapse this section' : 'Expand this section'}
            />
          )}
        </HStack>
        <Collapse in={isOpen} startingHeight="50px" animateOpacity>
          <SyntaxHighlighter
            language={effectiveLanguage}
            style={nord}
            showLineNumbers={true}
            startingLineNumber={startingLineNumber}
            lineNumberStyle={{
              color: '#666666'
            }}
            customStyle={{
              margin: 0
            }}
          >
            {contents || ''}
          </SyntaxHighlighter>
        </Collapse>
      </Box>
    );
  }
);
