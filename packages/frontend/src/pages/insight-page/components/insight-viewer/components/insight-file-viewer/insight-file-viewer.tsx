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

import { useParams } from 'react-router-dom';

import { Alert } from '../../../../../../components/alert/alert';
import { FileViewer, FileViewerProps } from '../../../../../../components/file-viewer/file-viewer';
import { Insight, InsightFile } from '../../../../../../models/generated/graphql';

const preferredMimeTypes = {
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'application/pdf',
  'application/x-ipynb+json': 'application/pdf'
};

const determineEffectiveFile = (file: InsightFile): InsightFile => {
  // Check preferred MIME type mapping to see if there's a better MIME type to display
  const preferredMime = file.mimeType ? preferredMimeTypes[file.mimeType] : undefined;

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

  return file;
};

export const InsightFileViewer = ({ insight, ...props }: { insight: Insight } & FileViewerProps) => {
  const params = useParams();
  const file = insight.files?.find((file) => {
    return file.path === params['*'];
  });

  if (file === undefined) {
    return <Alert warning="File not found" />;
  }

  const effectiveFile = determineEffectiveFile(file);

  return (
    <FileViewer
      mime={effectiveFile.mimeType}
      path={effectiveFile.path}
      baseAssetUrl={`/api/v1/insights/${insight.fullName}/assets`}
      baseLinkUrl={`/${insight.itemType}/${insight.fullName}/files`}
      breadcrumbs={[
        { text: insight.name, link: `/${insight.itemType}/${insight.fullName}` },
        ...file.path.split('/').map((part) => ({ text: part, link: '#' }))
      ]}
      contents={effectiveFile.contents}
      downloadPath={file.path}
      isConverted={effectiveFile.path !== file.path}
      {...props}
    />
  );
};
