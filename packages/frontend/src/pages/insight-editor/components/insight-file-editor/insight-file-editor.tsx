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

import type { FlexProps } from '@chakra-ui/react';
import { Flex, Spinner } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { Alert } from '../../../../components/alert/alert';
import { CodeEditor } from '../../../../components/code-editor/code-editor';
import { FileViewer } from '../../../../components/file-viewer/file-viewer';
import { HtmlSplitEditor } from '../../../../components/html-split-editor/html-split-editor';
import { MarkdownSplitEditor } from '../../../../components/markdown-split-editor/markdown-split-editor';
import type { InsightFile } from '../../../../models/file-tree';
import { InsightFileAction } from '../../../../models/file-tree';
import type { Insight, InsightFileInput, UploadSingleFileMutation } from '../../../../models/generated/graphql';
import {
  getLanguageForMime,
  getMimeForFileName,
  getMimeTypeDefinition,
  MIME_EDITOR
} from '../../../../shared/mime-utils';
import { useFetch } from '../../../../shared/useFetch';
import type { DraftForm } from '../../draft-form';

const preferredMimeTypes = {
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'application/pdf',
  'application/x-ipynb+json': 'text/html'
};

const determineEffectiveFile = (file: InsightFile): InsightFile => {
  if (file && file.mimeType) {
    // Check preferred MIME type mapping to see if there's a better MIME type to display
    const preferredMime = preferredMimeTypes[file.mimeType];

    if (preferredMime !== undefined && file.conversions != null) {
      // Check to see if we have a conversion for the preferred MIME type
      const conversion = file.conversions.find((c) => c.mimeType === preferredMime);

      if (conversion !== undefined) {
        // Rewrite the file with the converted path/mimeType
        return {
          ...file,
          path: conversion.path,
          mimeType: conversion.mimeType
        };
      }
    }
  }

  return file;
};

const FetchAndRender = ({ url, contents, renderer }) => {
  const {
    fetching,
    data: fetchedContents,
    error: fetchedError
  } = useFetch({
    url,
    contents
  });

  if (fetching) {
    return (
      <Flex my="5rem" mx="auto">
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
      </Flex>
    );
  } else if (fetchedError) {
    return <Alert error={fetchedError} />;
  } else {
    return renderer(fetchedContents);
  }
};

interface Props {
  baseAssetUrl?: string;
  baseLinkUrl?: string;
  file: InsightFile;
  form: UseFormReturn<DraftForm>;
  onFileChange: (updatedFile: InsightFileInput) => void;
  insight: Insight;
  transformAssetUri: (uri: string) => string;
  uploadFile: (file: File, name: string) => Promise<UploadSingleFileMutation | undefined>;
}

export const InsightFileEditor = ({
  baseAssetUrl = '/',
  baseLinkUrl = '/',
  file,
  form,
  onFileChange,
  insight,
  transformAssetUri,
  uploadFile,
  ...flexProps
}: Props & FlexProps) => {
  const [cachedFile, setCachedFile] = useState<InsightFile>(file);
  const [fileUrl] = useState<string>(transformAssetUri(cachedFile.originalPath ?? cachedFile.path));

  useEffect(() => {
    if (file.id !== cachedFile.id || file.name !== cachedFile.name) {
      setCachedFile(file);
    }
  }, [cachedFile.id, cachedFile.name, cachedFile.originalPath, cachedFile.path, file, transformAssetUri]);

  // If we can't edit, we need to identify the best version of the file to display
  const effectiveFile = determineEffectiveFile(cachedFile);

  if (cachedFile === undefined) {
    return <Alert warning="File not found" />;
  }

  const onContentsChanged = (contents: string) => {
    onFileChange({
      ...cachedFile,
      action: InsightFileAction.MODIFY,
      contents
    } as InsightFileInput);
  };

  const mime = cachedFile.mimeType ?? getMimeForFileName(cachedFile.name);
  const mimeTypeDef = getMimeTypeDefinition(mime);

  switch (mimeTypeDef?.editor ?? MIME_EDITOR.Code) {
    case MIME_EDITOR.Markdown: {
      return (
        <FetchAndRender
          url={fileUrl}
          contents={cachedFile.contents}
          renderer={(contents) => (
            <MarkdownSplitEditor
              contents={contents}
              getAutocompleteFiles={() => form.getValues('files')?.map((f) => f.path) ?? []}
              onChange={onContentsChanged}
              baseAssetUrl={baseAssetUrl}
              baseLinkUrl={baseLinkUrl}
              transformAssetUri={transformAssetUri}
              uploadFile={uploadFile}
              flexGrow={1}
              overflow="auto"
            />
          )}
        />
      );
      break;
    }

    case MIME_EDITOR.Html: {
      return (
        <FetchAndRender
          url={fileUrl}
          contents={cachedFile.contents}
          renderer={(contents) => (
            <HtmlSplitEditor contents={contents} onChange={onContentsChanged} flexGrow={1} overflow="auto" />
          )}
        />
      );
      break;
    }

    case MIME_EDITOR.Code: {
      return (
        <FetchAndRender
          url={fileUrl}
          contents={cachedFile.contents}
          renderer={(contents) => (
            <CodeEditor
              contents={contents}
              language={getLanguageForMime(cachedFile.mimeType ?? getMimeForFileName(cachedFile.name))}
              onContentsChange={onContentsChanged}
              readOnly={cachedFile.readonly}
            />
          )}
        />
      );

      break;
    }

    case MIME_EDITOR.None:
    default: {
      // Can't edit, so just render the file
      return (
        <FileViewer
          mime={effectiveFile.mimeType ?? mime}
          path={effectiveFile.path}
          baseAssetUrl={`/api/v1/insights/${insight.fullName}/assets`}
          baseLinkUrl={`/${insight.itemType}/${insight.fullName}/files`}
          contents={effectiveFile.contents}
          header="none"
          borderless={true}
          transformAssetUri={transformAssetUri}
          {...flexProps}
        />
      );
    }
  }
};
