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
import { InsightInfobar } from './components/insight-infobar/insight-infobar';
import { PageHeader } from './components/page-header/page-header';
import { ItemTypeViewerProps } from './item-type-viewer';

/**
 * Main pane of content---shared with normal/export view
 */
const MainView = ({ insight, isExport, onClone, onDelete, onFetchLikedBy, onLike }: ItemTypeViewerProps) => {
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
          mime="text/markdown"
          contents={insight.readme?.contents}
          baseAssetUrl={`/api/v1/insights/${insight.fullName}/assets`}
          baseLinkUrl={`/${insight.itemType}/${insight.fullName}/files`}
        />
      )}
    </>
  );
};

/***
 * Custom Header for ItemType===Page
 */
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

        {!isExport && <InsightInfobar insight={insight} />}

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
