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

import { useToast } from '@chakra-ui/react';
import isEqual from 'lodash/isEqual';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { gql, useMutation } from 'urql';

import { Alert } from '../../components/alert/alert';
import { Insight, UpdatedInsight, UploadSingleFileMutation } from '../../models/generated/graphql';
import { urqlClient } from '../../urql';

import { InsightEditor } from './insight-editor';

export type DraftDataInput = Partial<UpdatedInsight> & { commitMessage?: string; initializedTemplate?: boolean };

const DRAFT_UPSERT_MUTATION = gql`
  mutation UpsertDraft($draft: DraftInput!) {
    upsertDraft(draft: $draft) {
      draftKey
      createdAt
      updatedAt
      draftData
    }
  }
`;

const DRAFT_PUBLISH_MUTATION = gql`
  mutation PublishDraft($draftKey: String!) {
    publishDraft(draftKey: $draftKey) {
      id
      name
      fullName
      description
      url
      tags
      repository {
        url
        type
        owner {
          login
          type
          avatarUrl
        }
        isMissing
      }
      readme {
        contents
      }
      files {
        id
        name
        path
        mimeType
        size
      }
    }
  }
`;

const UPLOAD_SINGLE_FILE_MUTATION = gql`
  mutation UploadSingleFile($draftKey: String!, $attachment: InsightFileUploadInput!, $file: Upload!) {
    uploadSingleFile(draftKey: $draftKey, attachment: $attachment, file: $file) {
      id
      name
      path
      mimeType
      size
    }
  }
`;

/**
 * This component is rendered only after the following are available:
 *   - Insight
 *   - DraftKey
 *   - Draft (defaults to an empty object)
 */
export const InsightDraftContainer = ({ insight, draft, draftKey, onRefresh }) => {
  const toast = useToast();

  // Store copy of last saved draft for comparisons
  const [lastSavedDraft, setLastSavedDraft] = useState<DraftDataInput>(draft);

  const [publishDraftResult, publishDraft] = useMutation(DRAFT_PUBLISH_MUTATION);
  const { error: publishError, fetching: isPublishing } = publishDraftResult;

  const [upsertDraftResult, upsertDraft] = useMutation(DRAFT_UPSERT_MUTATION);
  const { error: upsertDraftError, fetching: isSavingDraft } = upsertDraftResult;

  // UploadFile method for pasting images
  const uploadFile = async (file: File, name: string): Promise<UploadSingleFileMutation | undefined> => {
    // Upload file to IEX storage
    const { data, error } = await urqlClient
      .mutation<UploadSingleFileMutation>(UPLOAD_SINGLE_FILE_MUTATION, {
        draftKey,
        attachment: {
          id: nanoid(),
          size: file.size,
          name
        },
        file: file
      })
      .toPromise();

    if (error || data === undefined) {
      toast({
        position: 'bottom-right',
        title: 'Unable to upload pasted image.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
    }

    return data;
  };

  // Save Drafts periodically, but only on changes
  // Calls to this callback should be throttled to avoid saving too often
  const saveDraft = async (draftData: DraftDataInput): Promise<boolean> => {
    // Skip if no changes have occurred
    if (isPublishing || isEqual(lastSavedDraft, draftData)) {
      return false;
    }

    console.log('Saving Draft', draftData, draftData.files);

    const result = await upsertDraft({
      draft: {
        draftKey,
        insightId: insight.id,
        draftData: draftData
      }
    });
    if (result.error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to save.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });

      return false;
    }

    setLastSavedDraft(draftData);

    toast({
      position: 'bottom-right',
      title: 'Draft saved.',
      status: 'success',
      duration: 2000,
      isClosable: true
    });

    return true;
  };

  const publish = async (draftData: DraftDataInput): Promise<Insight | undefined> => {
    // Ensure the saved draft is up-to-date
    await saveDraft(draftData);

    console.log('Publishing!');

    // Publish the saved draft
    const { data, error } = await publishDraft({ draftKey });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to save.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });

      return;
    }

    toast({
      position: 'bottom-right',
      title: 'Published!',
      status: 'success',
      duration: 2000,
      isClosable: true
    });

    return data.publishDraft;
  };

  return (
    <>
      {publishError && <Alert error={publishError} mb="1rem" />}
      {upsertDraftError && <Alert error={upsertDraftError} mb="1rem" />}

      <InsightEditor
        draftKey={draftKey}
        draft={draft}
        insight={insight}
        saveDraft={saveDraft}
        publish={publish}
        isSavingDraft={isSavingDraft}
        isPublishing={isPublishing}
        onRefresh={onRefresh}
        uploadFile={uploadFile}
      />
    </>
  );
};
