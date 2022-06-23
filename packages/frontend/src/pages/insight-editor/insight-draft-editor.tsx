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

import { Flex, Spinner, useToast } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { gql, useMutation } from 'urql';

import type { Insight } from '../../models/generated/graphql';
import type { ItemType } from '../../shared/item-type';
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

const CREATE_DRAFT_MUTATION = gql`
  mutation createDraft($itemType: String!, $draftKey: String!) {
    createDraft(itemType: $itemType, draftKey: $draftKey) {
      draftKey
      createdAt
      updatedAt
      draftData
    }
  }
`;

const APPLY_TEMPLATE_MUTATION = gql`
  mutation ApplyTemplateToDraft($draftKey: String!, $templateId: ID!) {
    applyTemplateToDraft(draftKey: $draftKey, templateId: $templateId) {
      draftKey
      createdAt
      updatedAt
      draftData
    }
  }
`;

interface Props {
  insight: Insight;
  draftKey: string;
  itemType: ItemType;
  onRefresh: any;
}

/**
 * The Insight Editor uses a draftKey to persist Drafts, and this key is
 * stored in the URL.  This component will attempt to load Drafts from the API
 * using their key.
 *
 * This component expects both an Insight and Draft Key to be provided.
 *
 * The InsightDraftContainer is not rendered until the draft has been loaded or initialized
 */
export const InsightDraftEditor = ({ insight, draftKey, itemType, onRefresh }: Props) => {
  const navigate = useNavigate();
  const toast = useToast();

  // This key can be updated to force a remount of the editor components
  const remountKey = useRef(nanoid());

  const [draft, setDraft] = useState<DraftDataInput | undefined>(undefined);

  const { appSettings } = useSelector((state: RootState) => state.app);

  const [, createDraft] = useMutation(CREATE_DRAFT_MUTATION);
  const [, applyTemplateToDraft] = useMutation(APPLY_TEMPLATE_MUTATION);

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
      } else {
        // No existing draft found, create a new one
        const { data } = await createDraft({
          itemType,
          draftKey
        });

        // Avoid changing state if already unmounted
        if (cancelled) return;

        setDraft(data.createDraft.draftData);
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
  }, [appSettings, createDraft, draft, draftKey, itemType, navigate]);

  const onApplyTemplate = async (templateId: string) => {
    const { data, error } = await applyTemplateToDraft({
      draftKey,
      templateId
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to apply template.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });

      return;
    }

    remountKey.current = nanoid();
    setDraft(data.applyTemplateToDraft.draftData);

    toast({
      position: 'bottom-right',
      title: 'Template applied.',
      status: 'success',
      duration: 2000,
      isClosable: true
    });
  };

  // Merge draft changes (if any) with Insight
  const mergedInsight = {
    ...insight,
    ...draft
  } as Insight;

  return (
    <Flex mt="0" direction="column" justify="stretch" flexGrow={2}>
      {!draft && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />}
      {draft && (
        <InsightDraftContainer
          key={remountKey.current}
          insight={mergedInsight}
          draft={draft}
          draftKey={draftKey}
          onApplyTemplate={onApplyTemplate}
          onRefresh={onRefresh}
        />
      )}
    </Flex>
  );
};
