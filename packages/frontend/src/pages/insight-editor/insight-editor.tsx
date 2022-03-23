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
  Badge,
  Flex,
  Progress,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import urljoin from 'url-join';

import { gql, useMutation, useQuery } from 'urql';

import { FileOrFolder, InsightFileAction } from '../../models/file-tree';
import { Insight, InsightFileInput, UploadSingleFileMutation } from '../../models/generated/graphql';
import { InsightFileTree, isFile } from '../../shared/file-tree';
import { isRelativeUrl } from '../../shared/url-utils';
import { useDebounce } from '../../shared/useDebounce';
import { RootState } from '../../store/store';
import { urqlClient } from '../../urql';

import { InsightEditorHeader } from './components/insight-editor-header/insight-editor-header';
import { InsightEditorSidebar } from './components/insight-editor-sidebar/insight-editor-sidebar';
import { InsightFileEditor } from './components/insight-file-editor/insight-file-editor';
import { InsightMetadataEditor } from './components/insight-metadata-editor/insight-metadata-editor';
import { DraftForm } from './draft-form';
import { DraftDataInput } from './insight-draft-container';

const TEMPLATES_QUERY = gql`
  query Templates {
    templates {
      id
      fullName
      name
    }
  }
`;

const TEMPLATE_BY_ID_QUERY = gql`
  query TemplateById($templateId: ID!) {
    template(templateId: $templateId) {
      id
      tags
      repository {
        url
        type
        owner {
          login
          type
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

const DELETE_DRAFT_MUTATION = gql`
  mutation DeleteDraft($draftKey: String!) {
    deleteDraft(draftKey: $draftKey) {
      draftKey
    }
  }
`;

interface Props {
  insight: Insight;
  draftKey: string;
  draft: DraftDataInput;
  saveDraft: (draft: DraftDataInput) => Promise<boolean>;
  publish: (draft: DraftDataInput) => Promise<Insight | undefined>;
  isPublishing: boolean;
  isSavingDraft: boolean;
  onRefresh: () => void;
  uploadFile: (file: File, name: string) => Promise<UploadSingleFileMutation | undefined>;
}

/**
 * InsightEditor renders the editor UI.
 *
 * Saving drafts and publishing the Insight are handled by callbacks.
 *
 * This component should not be rendered until `insight` and `draft` have been loaded.
 */
export const InsightEditor = memo(
  ({ insight, draftKey, draft, saveDraft, publish, isSavingDraft, isPublishing, onRefresh, uploadFile }: Props) => {
    const navigate = useNavigate();
    const toast = useToast();

    const { userInfo } = useSelector((state: RootState) => state.user);

    const ignoreDirtyCheck = useRef(false);
    const initDefaultTemplate = useRef(false);
    const loadingTemplate = useRef(false);

    const bgColor = useColorModeValue('white', 'gray.700');
    const color = useColorModeValue('gray.700', 'gray.200');

    const isNewInsight = insight.id === undefined;
    const isCloned = insight.creation?.clonedFrom != null;

    const readmeFile = insight.files?.find((f) => f.path === 'README.md');

    const [fileTree, setFileTree] = useState<InsightFileTree>(() =>
      // Convert the files into a nested tree object
      InsightFileTree.fromInsightFiles(insight.files ?? [])
    );

    // Selected Tab
    // The first tab (0) always contains Insight Metadata
    const [tabIndex, setTabIndex] = useState(0);

    // Selected File
    const [selectedFileId, setSelectedFileId] = useState<string | undefined>(readmeFile?.id);
    const selectedFile = fileTree.getFileById(selectedFileId);

    // Load templates list
    const [{ data: templatesData }] = useQuery({
      query: TEMPLATES_QUERY,
      pause: !isNewInsight
    });

    // Form tracking all Insight changes
    const form = useForm<DraftForm>({
      mode: 'onBlur',
      defaultValues: {
        tags: insight.tags,
        creation: insight.creation,
        itemType: insight.itemType,
        metadata: insight.metadata,
        files: (insight.files ?? []).map(
          (file): InsightFileInput => ({ ...file, action: 'none' as InsightFileAction })
        ),
        links: (insight.links ?? []).map(({ __typename, ...link }) => link),
        ...draft
      }
    });

    const { control, handleSubmit, reset, setValue } = form;
    form.register('itemType');
    form.register('files');
    form.register('creation.clonedFrom');
    form.register('creation.template');

    // This initialization flag is stored in the draft form so it is persisted across browser sessions
    form.register('initializedTemplate');

    // Watch entire form for changes
    // Debounce changes to avoid saving too often
    // The debounce timeout is set to 1500ms, so
    // saving will trigger after the editor has been
    // idle for 1.5 seconds.
    const changes = useWatch({ control });
    useDebounce(
      () => {
        saveDraft(changes as DraftDataInput);
      },
      1500,
      [changes, form, insight, saveDraft]
    );

    const itemType = useWatch({
      control,
      name: 'itemType',
      defaultValue: insight?.itemType
    });

    const onSubmit = async (formValues) => {
      const result = await publish(formValues);
      if (result !== undefined) {
        // Setting this ref true will disable the prompt on exit
        ignoreDirtyCheck.current = true;
        setTimeout(() => navigate(`/${itemType}/${result.fullName}`), 10);
      }
    };

    const [, discardDraft] = useMutation(DELETE_DRAFT_MUTATION);

    const onDiscard = async (): Promise<boolean> => {
      // Setting this ref true will disable the prompt on exit
      ignoreDirtyCheck.current = true;

      const { error } = await discardDraft({
        draftKey
      });

      if (error) {
        toast({
          position: 'bottom-right',
          title: 'Unable to discard Draft.',
          status: 'error',
          duration: 9000,
          isClosable: true
        });

        ignoreDirtyCheck.current = false;
        return false;
      }

      return true;
    };

    const templateChange = useCallback(
      async (selectedTemplate: Pick<Insight, 'id' | 'fullName'>): Promise<void> => {
        console.log(`Template change ${selectedTemplate.id} / ${selectedTemplate.fullName}`);
        loadingTemplate.current = true;

        // Templates
        const { data } = await urqlClient.query(TEMPLATE_BY_ID_QUERY, { templateId: selectedTemplate.id }).toPromise();
        const { id, ...template }: Insight = data.template;

        if (template) {
          // Retain name/description/itemType when changing templates
          const { name, description, itemType } = form.getValues();
          const newReadme = {
            id: nanoid(),
            action: InsightFileAction.MODIFY,
            name: 'README.md',
            path: 'README.md',
            mimeType: 'text/markdown',
            contents: template.readme?.contents
          };

          reset({ ...template, initializedTemplate: true, name, description, itemType } as any, { keepDirty: true });
          setValue('creation.template', selectedTemplate.fullName);
          setValue('tags', template.tags);

          // Update file tree
          fileTree.addItem(newReadme);
          setFileTree(fileTree);
          setValue('files', fileTree.flatten());

          // Update selected file id
          setSelectedFileId(newReadme.id);
        }

        loadingTemplate.current = false;
      },
      [fileTree, form, reset, setValue]
    );

    useEffect(() => {
      const f = async () => {
        if (
          !initDefaultTemplate.current &&
          isNewInsight &&
          !isCloned &&
          templatesData &&
          userInfo?.defaultTemplateId &&
          !form.getValues('initializedTemplate')
        ) {
          loadingTemplate.current = true;
          const defaultTemplate = templatesData.templates.find(
            (template) => template.id === userInfo.defaultTemplateId
          );
          initDefaultTemplate.current = true;
          await templateChange(defaultTemplate);
        }
      };
      f();
    }, [form, isCloned, isNewInsight, templateChange, templatesData, userInfo]);

    const fileTreeChange = (updatedTree: InsightFileTree): void => {
      setFileTree(updatedTree);
      setValue('files', fileTree.flatten());
    };

    const fileChange = (updatedFile: InsightFileInput): void => {
      if (fileTree !== undefined) {
        fileTree.updateItemById(updatedFile as FileOrFolder);

        fileTreeChange(fileTree);
      }
    };

    const transformAssetUri = (uri: string): string => {
      // Decode URI in case it's needed
      uri = decodeURI(uri);

      if (isRelativeUrl(uri)) {
        if (uri[0] === '/') {
          uri = uri.substring(1);
        }

        const file = fileTree.getFileByPath(uri);
        if (file && isFile(file)) {
          if (file.action && ['add', 'modify'].includes(file.action)) {
            // Draft file
            return urljoin(`/api/v1/drafts/${draftKey}/assets`, file.id);
          }

          // Insight file, not from the draft
          return urljoin(`/api/v1/insights/${insight.fullName}/assets`, file.originalPath ?? uri);
        }

        // Probably a converted file URL
        return urljoin(`/api/v1/insights/${insight.fullName}/assets`, uri);
      }

      return uri;
    };

    const uploadFileWrapper = async (file: File, name: string): Promise<UploadSingleFileMutation | undefined> => {
      const data = await uploadFile(file, name);
      if (data) {
        fileTree.addItem({ ...data?.uploadSingleFile, action: InsightFileAction.ADD });
        fileTreeChange(fileTree);
      }

      return data;
    };

    return (
      <Flex
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        direction="column"
        justify="stretch"
        flexGrow={2}
        bg={bgColor}
        borderRadius="0.5rem"
      >
        <InsightEditorHeader
          insight={insight}
          isPublishing={isPublishing}
          isSavingDraft={isSavingDraft}
          form={form}
          onDiscard={onDiscard}
          onRefresh={onRefresh}
        />
        <Flex flexDirection={{ base: 'column', md: 'row' }}>
          <InsightEditorSidebar
            insight={insight}
            draftKey={draftKey}
            isNewInsight={isNewInsight}
            form={form}
            fileTree={fileTree}
            onFileTreeChanged={fileTreeChange}
            flexBasis={{ base: 'unset', md: '20rem', xl: '22rem' }}
            flexShrink={0}
            maxW={{ base: 'unset', md: '20rem', xl: '26rem' }}
            minW={0}
            borderBottomWidth="1px"
            borderLeftWidth="1px"
            borderRightWidth="1px"
            borderBottomLeftRadius={{ base: 'none', md: 'lg' }}
            onSelectFile={(file) => {
              setSelectedFileId(file?.id);
              setTabIndex(1);
            }}
          />

          <Tabs
            index={tabIndex}
            onChange={(index: number) => setTabIndex(index)}
            flex="5 1 50%"
            overflow="auto"
            borderColor="gray.300"
            borderWidth="1px"
            borderTopWidth={0}
            borderBottomRightRadius="lg"
          >
            <TabList bg={bgColor} color={color}>
              <Tab>Metadata</Tab>
              <Tab>
                {selectedFile?.name === '' ? '<New File>' : selectedFile?.name}
                {selectedFile?.readonly && <Badge ml="0.5rem">readonly</Badge>}
              </Tab>
            </TabList>

            <TabPanels display="flex" flexGrow={1}>
              <TabPanel display="flex" flexDirection="column" flexGrow={1}>
                {loadingTemplate.current && <Progress size="xs" isIndeterminate />}
                <InsightMetadataEditor
                  insight={insight}
                  isNewInsight={isNewInsight}
                  form={form}
                  templates={templatesData?.templates ?? []}
                  templateChange={templateChange}
                />
              </TabPanel>
              <TabPanel display="flex" overflow="auto" flexGrow={1} padding={0}>
                {selectedFile && (
                  <InsightFileEditor
                    key={selectedFileId}
                    insight={insight}
                    file={selectedFile}
                    onFileChange={fileChange}
                    baseAssetUrl={`/api/v1/insights/${insight.fullName}/assets`}
                    baseLinkUrl={`/${itemType}/${insight.fullName}/files`}
                    transformAssetUri={transformAssetUri}
                    uploadFile={uploadFileWrapper}
                    flexGrow={1}
                    overflow="auto"
                  />
                )}
                {/* <MarkdownSplitEditor
                name="readme.contents"
                contents={updatedReadme}
                form={form}
                flexGrow={1}
                overflow="auto"
                baseAssetUrl={`/api/v1/insights/${insight.fullName}/assets`}
                baseLinkUrl={`/${itemType}/${insight.fullName}/files`}
                transformAssetUri={transformAssetUri}
              /> */}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Flex>
      </Flex>
    );
  }
);
