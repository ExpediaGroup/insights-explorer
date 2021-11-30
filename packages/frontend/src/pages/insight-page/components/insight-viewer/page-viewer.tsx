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

import {
  Collapse,
  Flex,
  IconButton,
  Tag,
  TagLabel,
  Text,
  useDisclosure,
  VStack,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';
import { Routes, Route, Link } from 'react-router-dom';

import { Alert } from '../../../../components/alert/alert';
import { FileViewer } from '../../../../components/file-viewer/file-viewer';
import { InsightAuthor } from '../../../../components/insight-author/insight-author';
import { InsightTag } from '../../../../components/insight-tag/insight-tag';
import { SidebarHeading } from '../../../../components/sidebar-heading/sidebar-heading';
import { TeamTag } from '../../../../components/team-tag/team-tag';
import { formatDateIntl, formatRelativeIntl } from '../../../../shared/date-utils';
import { iconFactoryAs } from '../../../../shared/icon-factory';

import { ExportFooter } from './components/export-footer/export-footer';
import { ExportHeader } from './components/export-header/export-header';
import { GitHubButton } from './components/github-button/github-button';
import { InsightActivity } from './components/insight-activity/insight-activity';
import { InsightComments } from './components/insight-comments/insight-comments';
import { InsightFileViewer } from './components/insight-file-viewer/insight-file-viewer';
import { PageHeader } from './components/page-header/page-header';
import { ShareMenu } from './components/share-menu/share-menu';
import { ItemTypeViewerProps } from './item-type-viewer';

/**
 * Main pane of content---shared with normal/export view
 */
const MainView = ({ insight, isExport, onClone, onDelete, onFetchLikedBy, onLike }: ItemTypeViewerProps) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });

  return (
    <>
      {insight.repository.isMissing && (
        <Alert
          warning="The repository for this Page is missing; it may have been deleted or archived. While this Page can still be viewed, it cannot be edited."
          mb="1rem"
        />
      )}

      {/* README or alert notification */}
      {(insight.readme?.contents == null && <Alert warning="This Page doesn't have a README.md" mb="1rem" />) || (
        <FileViewer
          allowDownload={false}
          borderless={true}
          header={isExport ? 'none' : 'stealth'}
          headerStyles={{ align: 'flex-start' }}
          headerContent={
            <Flex flexDirection="column" align="stretch">
              <Wrap spacing="0.25rem" shouldWrapChildren={true} align="center">
                <IconButton
                  aria-label="Expand/collapse"
                  icon={isOpen ? iconFactoryAs('chevronUp') : iconFactoryAs('chevronDown')}
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  title={isOpen ? 'Collapse this section' : 'Expand this section'}
                />

                {insight.metadata?.team && <TeamTag team={insight.metadata.team} size="md" />}

                {insight.authors.edges.map(({ node: author }) => (
                  <InsightAuthor key={author.userName} author={author} size="md" width="100%" />
                ))}

                {insight.tags?.length > 0 && insight.tags.map((tag) => <InsightTag key={tag} tag={tag} size="md" />)}
              </Wrap>
              <Collapse in={isOpen} animateOpacity>
                <VStack spacing="1rem" ml="2.5rem" align="stretch" mt="1rem">
                  <Wrap align="center" spacing="0.5rem">
                    {insight.metadata?.publishedDate != null && (
                      <WrapItem alignItems="baseline">
                        <SidebarHeading mr="0.5rem">Published Date</SidebarHeading>
                        <Text fontSize="md">{formatDateIntl(insight.metadata.publishedDate, DateTime.DATE_MED)}</Text>
                      </WrapItem>
                    )}

                    <WrapItem alignItems="baseline">
                      <SidebarHeading mr="0.5rem">Last Updated</SidebarHeading>
                      <Text fontSize="md">
                        {formatDateIntl(insight.updatedAt, DateTime.DATETIME_MED)} (
                        {formatRelativeIntl(insight.updatedAt)})
                      </Text>
                    </WrapItem>

                    <WrapItem alignItems="baseline">
                      <SidebarHeading mr="0.5rem">Created</SidebarHeading>
                      <Text fontSize="md">
                        {formatDateIntl(insight.createdAt, DateTime.DATETIME_MED)} (
                        {formatRelativeIntl(insight.createdAt)})
                      </Text>
                    </WrapItem>
                  </Wrap>
                  {insight.files && insight.files.length > 0 && (
                    <Wrap align="center" spacing="0.5rem" shouldWrapChildren={true}>
                      <SidebarHeading mr="0.5rem">Files</SidebarHeading>
                      {insight.files.map((file) => {
                        return (
                          <Link to={`/${insight.itemType}/${insight.fullName}/files/${file.path}`} key={file.id}>
                            <Tag rounded="full">
                              <TagLabel>{file.path}</TagLabel>
                            </Tag>
                          </Link>
                        );
                      })}
                    </Wrap>
                  )}
                </VStack>
              </Collapse>
            </Flex>
          }
          headerRightContent={
            <>
              <GitHubButton insight={insight} size="sm" fontSize="1rem" mr="0.5rem" />
              <ShareMenu insight={insight} size="sm" fontSize="1rem" />
            </>
          }
          mime="text/markdown"
          contents={insight.readme?.contents}
          baseAssetUrl={`/api/v1/insights/${insight.fullName}/assets`}
          baseLinkUrl={`/${insight.itemType}/${insight.fullName}/files`}
        />
      )}
    </>
  );
};

export const PageViewer = ({
  insight,
  nextInsight,
  previousInsight,
  isExport,
  onClone,
  onDelete,
  onFetchLikedBy,
  onLike
}: ItemTypeViewerProps) => {
  return (
    <>
      <Helmet>
        <title>{insight.name}</title>
      </Helmet>

      <Flex
        direction="column"
        justify="stretch"
        border="1px solid"
        borderColor="gray.300"
        borderRadius="0.5rem"
        overflow="hidden"
      >
        <PageHeader
          insight={insight}
          nextInsight={nextInsight}
          previousInsight={previousInsight}
          onClone={onClone}
          onDelete={onDelete}
          onFetchLikedBy={onFetchLikedBy}
          onLike={onLike}
          isExport={isExport}
        />

        {isExport && <ExportHeader insight={insight} mt="0.5rem" />}

        <VStack spacing="1rem" align="stretch" flexGrow={1} overflow="hidden">
          <Routes>
            {/* Insight README (& alerts) */}
            <Route
              path="/*"
              element={
                <MainView
                  insight={insight}
                  onClone={onClone}
                  onDelete={onDelete}
                  onLike={onLike}
                  onFetchLikedBy={onFetchLikedBy}
                  isExport={isExport}
                />
              }
            />

            {/* File viewer */}
            <Route path="/files/*" element={<InsightFileViewer insight={insight} borderless={true} />} />

            {!isExport && (
              <>
                {/* Debug: Insight as JSON viewer */}
                <Route
                  path="/json"
                  element={
                    <FileViewer
                      mime="application/json"
                      contents={JSON.stringify(insight, null, 2)}
                      baseAssetUrl={`/api/v1/insights/${insight.fullName}/assets`}
                      baseLinkUrl={`/${insight.itemType}/${insight.fullName}/files`}
                      borderless={true}
                      breadcrumbs={[
                        { text: insight.name, link: `/${insight.itemType}/${insight.fullName}` },
                        { text: 'JSON', link: '#' }
                      ]}
                    />
                  }
                />

                {/* Standalone comment viewer */}
                <Route path="/discuss" element={<InsightComments insight={insight} />} />

                {/* Activity view */}
                <Route path="/activity" element={<InsightActivity insight={insight} />} />
              </>
            )}
          </Routes>

          {isExport && <ExportFooter insight={insight} mt="0.5rem" />}
        </VStack>
      </Flex>
    </>
  );
};
