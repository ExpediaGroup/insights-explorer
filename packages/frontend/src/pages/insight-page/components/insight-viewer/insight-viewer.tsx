/**
 * Copyright 2022 Expedia, Inc.
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

import { Flex, VStack } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';
import { Routes, Route } from 'react-router-dom';

import { Alert } from '../../../../components/alert/alert';
import { FileViewer } from '../../../../components/file-viewer/file-viewer';

import { ExportFooter } from './components/export-footer/export-footer';
import { ExportHeader } from './components/export-header/export-header';
import { InsightActivity } from './components/insight-activity/insight-activity';
import { InsightComments } from './components/insight-comments/insight-comments';
import { InsightFileViewer } from './components/insight-file-viewer/insight-file-viewer';
import { InsightHeader } from './components/insight-header/insight-header';
import { InsightInfobar } from './components/insight-infobar/insight-infobar';
import { InsightSidebar } from './components/insight-sidebar/insight-sidebar';
import type { ItemTypeViewerProps } from './item-type-viewer';
import { PageViewer } from './page-viewer';

/**
 * Main pane of content---shared with normal/export view
 */
const MainView = ({ insight, isExport, onClone, onDelete, onFetchLikedBy, onLike }: ItemTypeViewerProps) => {
  return (
    <>
      {insight.repository.isMissing && (
        <Alert
          warning="The repository for this Insight is missing; it may have been deleted or archived. While this Insight can still be viewed, it cannot be edited."
          mb="1rem"
        />
      )}

      {/* README or alert notification */}
      {(insight.readme?.contents == null && <Alert warning="This Insight doesn't have a README.md" mb="1rem" />) || (
        <FileViewer
          allowDownload={false}
          header={isExport ? 'none' : 'stealth'}
          mime="text/markdown"
          contents={insight.readme?.contents}
          baseAssetUrl={`/api/v1/insights/${insight.fullName}/assets`}
          baseLinkUrl={`/${insight.itemType}/${insight.fullName}/files`}
        />
      )}

      {/* Comments */}
      {!isExport && <InsightComments insight={insight} inline={true} />}
    </>
  );
};

export const InsightViewer = ({
  insight,
  isExport,
  nextInsight,
  previousInsight,
  onClone,
  onDelete,
  onFetchLikedBy,
  onLike
}: ItemTypeViewerProps) => {
  if (insight.itemType === 'page') {
    return (
      <PageViewer
        insight={insight}
        onClone={onClone}
        onDelete={onDelete}
        onLike={onLike}
        onFetchLikedBy={onFetchLikedBy}
        isExport={isExport}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{insight.name}</title>
      </Helmet>

      <Flex direction="column" justify="stretch" flexGrow={2}>
        <InsightHeader
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

        {/* Mobile-only */}
        {!isExport && <InsightInfobar insight={insight} display={{ base: 'flex', md: 'none' }} />}

        <Flex direction="row">
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
              <Route path="/files/*" element={<InsightFileViewer insight={insight} />} />

              {!isExport && (
                <>
                  {/* Debug: Insight as JSON viewer */}
                  <Route
                    path="/json"
                    element={
                      <FileViewer
                        mime="application/json"
                        defaultMode="raw"
                        canRender={false}
                        contents={JSON.stringify(insight, null, 2)}
                        baseAssetUrl={`/api/v1/insights/${insight.fullName}/assets`}
                        baseLinkUrl={`/${insight.itemType}/${insight.fullName}/files`}
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

          {/* Desktop-only */}
          {!isExport && (
            <InsightSidebar
              insight={insight}
              flexBasis={{ base: '16rem', md: '20rem', xl: '22rem' }}
              flexShrink={0}
              maxWidth={{ base: '16rem', md: '20rem', xl: '22rem' }}
              ml="1rem"
              mt="0.5rem"
              display={{ base: 'none', md: 'flex' }}
            />
          )}
        </Flex>
      </Flex>
    </>
  );
};
