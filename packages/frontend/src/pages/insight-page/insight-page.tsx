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

import { Flex, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';

import { Alert } from '../../components/alert/alert';
import { SecureRoute } from '../../components/secure-route/secure-route';
import { useInsight } from '../../shared/useInsight';
import { useLikedBy } from '../../shared/useLikedBy';
import { RootState } from '../../store/store';
import { InsightDraftSwitcher } from '../insight-editor/insight-draft-switcher';
import { InsightNotFoundPage } from '../insight-not-found-page/insight-not-found-page';

import { InsightSkeleton } from './components/insight-skeleton/insight-skeleton';
import { ItemTypeViewer } from './components/insight-viewer/item-type-viewer';

/**
 * This component loads an Insight by name, then
 * renders either the InsightViewer or InsightDraftSwitcher.
 */
export const InsightPage = ({ isExport = false }) => {
  const { results: searchResults } = useSelector((state: RootState) => state.search);

  const { owner, name } = useParams();

  const toast = useToast();
  const navigate = useNavigate();

  const [
    { data, fetching, error },
    { cloneInsight, deleteInsight, likeInsight, refreshInsight, viewInsight }
  ] = useInsight({
    fullName: `${owner}/${name}`
  });

  const [logView, setLogView] = useState(false);

  const { onFetchLikedBy } = useLikedBy('insight');

  // Insight will be undefined when it hasn't loaded yet
  // The API returns null when the Insight does not exist
  const insight = data?.insight;

  // Determine the next and previous insight based on the search results from the state.
  let previousInsight, nextInsight;
  if (insight) {
    const insightIndex = searchResults.findIndex((res) => res.fullName === insight.fullName);
    const previousIndex = insightIndex - 1;
    const nextIndex = insightIndex + 1;

    previousInsight = previousIndex > -1 && insightIndex > -1 ? searchResults[previousIndex] : null;
    nextInsight = nextIndex < searchResults.length && insightIndex > -1 ? searchResults[nextIndex] : null;
  }

  const onClone = async (): Promise<boolean> => {
    const { data, error } = await cloneInsight({
      insightId: insight.id
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to clone Insight.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
      return false;
    }

    const draftKey = data.cloneInsight.draftKey;
    navigate(`/edit/${draftKey}`);

    return true;
  };

  const onDelete = async (): Promise<boolean> => {
    const { error } = await deleteInsight({
      insightId: insight.id
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to delete Insight.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
      return false;
    }

    return true;
  };

  const onLike = async (liked: boolean): Promise<boolean> => {
    const { error } = await likeInsight({
      insightId: insight.id,
      liked
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to like Insight.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
      return false;
    }

    return true;
  };

  useEffect(() => {
    async function recordViewInsight() {
      if (insight) {
        try {
          const activity = await viewInsight({ insightId: insight.id, insightName: insight.fullName });
          console.log(`Activity logged: ${activity.data.viewInsight.id}`);
          setLogView(true);
        } catch (error) {
          console.error(error);
        }
      }
    }
    if (!logView) {
      recordViewInsight();
    }
  }, [viewInsight, insight, logView]);

  return (
    <Flex direction="column" justify="stretch" flexGrow={2}>
      {error && <Alert error={error} mb="1rem" />}

      {!insight && fetching && <InsightSkeleton />}

      {insight === null && !fetching && <InsightNotFoundPage />}

      {insight && (
        <Routes>
          <Route
            path="edit/*"
            element={
              <SecureRoute>
                <InsightDraftSwitcher insight={insight} onRefresh={refreshInsight} />
              </SecureRoute>
            }
          />
          <Route
            path="*"
            element={
              <ItemTypeViewer
                insight={insight}
                nextInsight={nextInsight}
                previousInsight={previousInsight}
                onClone={onClone}
                onDelete={onDelete}
                onLike={onLike}
                onFetchLikedBy={onFetchLikedBy}
                isExport={isExport}
              />
            }
          />
        </Routes>
      )}
    </Flex>
  );
};
