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

import { Flex, Spinner } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { gql } from 'urql';

import { InsightFileAction } from '../../models/file-tree';
import type { RootState } from '../../store/store';
import { urqlClient } from '../../urql';

import type { DraftDataInput } from './insight-draft-container';
import { InsightDraftContainer } from './insight-draft-container';

const DRAFT_QUERY = gql`
  query draftByKey($draftKey: String!) {
    draftByKey(draftKey: $draftKey) {
      draftKey
      createdAt
      updatedAt
      draftData
    }
  }
`;

/**
 * The Insight Editor uses a draftKey to persist Drafts, and this key is
 * stored in the URL.  This component will attempt to load Drafts from the API
 * using their key.
 *
 * This component expects both an Insight and Draft Key to be provided.
 *
 * The InsightDraftContainer is not rendered until the draft has been loaded or initialized
 */
export const InsightDraftEditor = ({ insight, draftKey, clonedFrom, itemType, onRefresh }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DraftDataInput | undefined>(undefined);

  const { appSettings } = useSelector((state: RootState) => state.app);

  const defaultInsight = {
    commitMessage: 'Initial commit',
    namespace: appSettings?.gitHubSettings.defaultOrg,
    name: '',
    tags: [],
    itemType: itemType ?? 'insight',
    files: [
      {
        id: nanoid(),
        action: InsightFileAction.MODIFY,
        name: 'README.md',
        path: 'README.md',
        mimeType: 'text/markdown',
        contents: ''
      }
    ]
  };

  useEffect(() => {
    let cancelled = false;

    // Attempt to load saved draft contents (if any)
    const loadDraft = async () => {
      const { data } = await urqlClient.query(DRAFT_QUERY, { draftKey }).toPromise();

      // Avoid changing state if already unmounted
      if (cancelled) return;

      if (data?.draftByKey) {
        // Use existing draft from server
        setDraft(data?.draftByKey.draftData);
      } else if (clonedFrom) {
        // Handle cloning an Insight passed through the route state
        // TODO: support cloning insights with files
        setDraft({
          commitMessage: 'Cloned from ' + clonedFrom.fullName,
          namespace: appSettings?.gitHubSettings.defaultOrg,
          name: clonedFrom.name,
          description: clonedFrom.description,
          tags: clonedFrom.tags,
          readme: {
            contents: clonedFrom.readme?.contents
          },
          creation: {
            clonedFrom: clonedFrom.fullName
          }
        });
      } else {
        // If there is no draft data, assume it's a new draft key and initialize with an empty object
        setDraft({});
      }
    };

    // Only load once; any future changes made will already be available locally
    if (draft === undefined) {
      loadDraft();
    }

    return () => {
      cancelled = true;
      return;
    };
  }, [appSettings, clonedFrom, draft, draftKey, navigate]);

  // Merge draft changes (if any) with Insight
  const mergedInsight = {
    ...(insight || defaultInsight),
    ...draft
  };

  return (
    <Flex mt="0" direction="column" justify="stretch" flexGrow={2}>
      {!draft && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />}
      {draft && (
        <InsightDraftContainer insight={mergedInsight} draft={draft} draftKey={draftKey} onRefresh={onRefresh} />
      )}
    </Flex>
  );
};
