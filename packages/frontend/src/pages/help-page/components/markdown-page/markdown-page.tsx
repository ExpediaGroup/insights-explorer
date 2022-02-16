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

import { Flex, IconButton } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';

import { FileViewer } from '../../../../components/file-viewer/file-viewer';
import { iconFactoryAs } from '../../../../shared/icon-factory';
import { HelpSidebar } from '../help-sidebar/help-sidebar';

const links = [
  {
    name: 'Basic Syntax',
    hash: 'basic-syntax',
    children: [
      { name: 'Headings', hash: 'headings' },
      { name: 'Paragraphs', hash: 'paragraphs' },
      { name: 'Character Styles', hash: 'character-styles' },
      { name: 'Block Quotes', hash: 'block-quotes' },
      {
        name: 'Lists',
        hash: 'lists',
        children: [
          { name: 'Unordered Lists', hash: 'unordered-lists' },
          { name: 'Ordered Lists', hash: 'ordered-lists' },
          { name: 'Nested Lists', hash: 'nested-lists' },
          { name: 'Additional Nested Content', hash: 'additional-nested-content' }
        ]
      },
      {
        name: 'Links',
        hash: 'links',
        children: [
          { name: 'Autolinks', hash: 'autolinks' },
          { name: 'Section Links', hash: 'section-links' },
          { name: 'Relative Links', hash: 'relative-links' },
          { name: 'Reference Links', hash: 'reference-links' }
        ]
      },
      {
        name: 'Images',
        hash: 'images',
        children: [
          { name: 'Relative URLs', hash: 'relative-urls' },
          { name: 'Identifiers', hash: 'identifiers' }
        ]
      },
      {
        name: 'Code',
        hash: 'code',
        children: [
          { name: 'Inline Code', hash: 'inline-code' },
          { name: 'Code Blocks', hash: 'code-blocks' },
          { name: 'Fenced Code Blocks', hash: 'fenced-code-blocks' },
          { name: 'Indented Code Blocks', hash: 'indented-code-blocks' },
          { name: 'Nested Code Blocks', hash: 'nested-code-blocks' },
          { name: 'Collapsed Code Blocks', hash: 'collapsed-code-blocks' },
          { name: 'Included Code Blocks', hash: 'included-code-blocks' }
        ]
      },
      { name: 'Horizontal Lines', hash: 'horizontal-lines' },
      { name: 'Comments', hash: 'comments' },
      { name: 'Escaping Characters', hash: 'escaping-characters' }
    ]
  },
  {
    name: 'Advanced Features',
    hash: 'advanced-features',
    children: [
      { name: 'Table of Contents', hash: 'table-of-contents-iex', iex: true },
      { name: 'Footnotes', hash: 'footnotes' },
      { name: 'Syntax Highlighting', hash: 'syntax-highlighting' },
      { name: 'Tables', hash: 'tables' },
      { name: 'Task List', hash: 'task-list' },
      { name: 'Emojis', hash: 'emojis-' },
      { name: 'Collapsible Sections', hash: 'collapsible-sections' },
      {
        name: 'Directives',
        hash: 'directives-iex',
        children: [
          { name: 'Badges', hash: 'badges-iex', iex: true },
          { name: 'Tables (Directive)', hash: 'tables-directive-iex', iex: true },
          { name: 'Images (Directive)', hash: 'images-directive-iex', iex: true },
          { name: 'Videos', hash: 'videos-iex', iex: true },
          { name: 'Insight', hash: 'insight-iex', iex: true },
          { name: 'Insight Search', hash: 'insight-search-iex', iex: true },
          { name: 'Math (KaTeX)', hash: 'math-katex-iex', iex: true },
          { name: 'Vega Charts', hash: 'vega-charts-iex', iex: true },
          { name: 'Xkcd-Style Charts', hash: 'xkcd-style-charts-iex', iex: true }
        ]
      },
      { name: 'HTML', hash: 'html' }
    ]
  }
];

export const MarkdownPage = () => {
  return (
    <>
      <Helmet>
        <title>Markdown | Help</title>
      </Helmet>

      <Flex direction="row" mt="2rem">
        <FileViewer
          allowDownload={false}
          breadcrumbs={[
            { text: 'Help', link: `/help` },
            { text: 'Markdown', link: '#' }
          ]}
          baseAssetUrl="/api/v1"
          baseLinkUrl="/api/v1"
          path="/markdown"
          header="stealth"
          mime="text/markdown"
          flexGrow={2}
          overflow="hidden"
        />

        <HelpSidebar links={links} headerTitle="Markdown" />
      </Flex>

      <IconButton
        display={{ base: 'none', sm: 'flex' }}
        aria-label={'Scroll To Top'}
        isRound={true}
        position="fixed"
        width="3rem"
        height="3rem"
        bottom="1.5rem"
        left="1.5rem"
        variant="frost"
        boxShadow="2px 2px 3px #555"
        icon={iconFactoryAs('chevronUp')}
        onClick={(e) => {
          window.scrollTo(0, 0);
        }}
      />
    </>
  );
};
