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

// Available Prism languages here:
// https://github.com/react-syntax-highlighter/react-syntax-highlighter/blob/master/AVAILABLE_LANGUAGES_PRISM.MD

// Available Ace modes here:
// https://github.com/ajaxorg/ace-builds/tree/master/src-min-noconflict

export enum MIME_EDITOR {
  Code,
  Html,
  Markdown,
  None
}

export enum MIME_VIEWER {
  Code,
  Html,
  Image,
  Markdown,
  PDF,
  Video,
  None
}

export interface MimeTypeDefinition {
  mimeType: string;
  editorLanguage?: string;
  editor?: MIME_EDITOR;
  viewer?: MIME_VIEWER;
}

const mimeTypes: MimeTypeDefinition[] = [
  {
    mimeType: 'application/x-ipynb+json',
    editor: MIME_EDITOR.Code,
    viewer: MIME_VIEWER.Code
  },
  {
    mimeType: 'application/javascript',
    editorLanguage: 'javascript',
    editor: MIME_EDITOR.Code,
    viewer: MIME_VIEWER.Code
  },
  { mimeType: 'application/json', editorLanguage: 'json', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'application/pdf', editor: MIME_EDITOR.None, viewer: MIME_VIEWER.PDF },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    editor: MIME_EDITOR.None,
    viewer: MIME_VIEWER.None
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    editor: MIME_EDITOR.None,
    viewer: MIME_VIEWER.None
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    editor: MIME_EDITOR.None,
    viewer: MIME_VIEWER.None
  },
  { mimeType: 'application/x-sh', editorLanguage: 'bash', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'application/x-sql', editorLanguage: 'sql', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  {
    mimeType: 'application/x-typescript',
    editorLanguage: 'typescript',
    editor: MIME_EDITOR.Code,
    viewer: MIME_VIEWER.Code
  },
  { mimeType: 'application/xml', editorLanguage: 'xml', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },

  { mimeType: 'image/*', editor: MIME_EDITOR.None, viewer: MIME_VIEWER.Image },

  { mimeType: 'text/html', editorLanguage: 'xml', editor: MIME_EDITOR.Html, viewer: MIME_VIEWER.Html },
  { mimeType: 'text/markdown', editorLanguage: 'markdown', editor: MIME_EDITOR.Markdown, viewer: MIME_VIEWER.Markdown },
  { mimeType: 'text/plain', editorLanguage: 'text', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'text/x-clojure', editorLanguage: 'clojure', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'text/x-groovy', editorLanguage: 'groovy', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'text/x-java-source', editorLanguage: 'java', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'text/x-python', editorLanguage: 'python', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'text/x-r', editorLanguage: 'r', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'text/x-ruby', editorLanguage: 'ruby', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'text/x-scala', editorLanguage: 'scala', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'text/yaml', editorLanguage: 'yaml', editor: MIME_EDITOR.Code, viewer: MIME_VIEWER.Code },
  { mimeType: 'video/*', editor: MIME_EDITOR.None, viewer: MIME_VIEWER.Video }
];

export function getMimeTypeDefinition(mimeType?: string): MimeTypeDefinition | undefined {
  if (mimeType === undefined) {
    return undefined;
  }

  mimeType = mimeType.toLowerCase();

  const exactMatch = mimeTypes.find((m) => m.mimeType === mimeType);
  if (exactMatch !== undefined) {
    return exactMatch;
  }

  // Attempt a wildcard search
  const group = mimeType.split('/')[0];
  const groupMatch = mimeTypes.find((m) => m.mimeType === `${group}/*`);
  return { ...groupMatch, mimeType };
}

const extentionToMime = {
  avi: 'video/x-msvideo',
  clj: 'text/x-clojure',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  drawio: 'application/xml',
  gif: 'image/gif',
  gitignore: 'text/plain',
  go: 'text/x-go',
  groovy: 'text/x-groovy',
  ipynb: 'application/x-ipynb+json',
  java: 'text/x-java-source',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'application/javascript',
  json: 'application/json',
  htm: 'text/html',
  html: 'text/html',
  md: 'text/markdown',
  mov: 'video/quicktime',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  mp4: 'video/mp4',
  pipeline: 'text/x-groovy',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  py: 'text/x-python',
  r: 'text/x-r',
  rb: 'text/x-ruby',
  scala: 'text/x-scala',
  sh: 'application/x-sh',
  sql: 'application/x-sql',
  svg: 'image/svg+xml',
  ts: 'application/x-typescript',
  txt: 'text/plain',
  webm: 'video/webm',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xml: 'application/xml',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  zip: 'application/zip'
};

export function getLanguageForMime(mimeType: string): string {
  const mime = getMimeTypeDefinition(mimeType);
  if (mime?.editorLanguage !== undefined) {
    return mime.editorLanguage;
  }

  // Unknown, return unstyled
  return 'text';
}

/**
 * This function provides MIME detection for the frontend.
 * When new files are uploaded/created in the editor, we need to determine
 * their MIME type in order to show the correct editor/viewer/icon.
 *
 * This function competes with the MIME detection provided in the backend when syncing Insights
 *
 * TODO: Unify them!
 */
export function getMimeForFileName(fileName?: string, fallback = 'text/plain'): string {
  if (fileName !== undefined) {
    const extension = fileName.split('.').pop() ?? fileName;
    const mimeType = extentionToMime[extension.toLowerCase()];

    if (mimeType !== undefined) {
      return mimeType;
    }
  }

  // Unknown, return fallback
  return fallback;
}
