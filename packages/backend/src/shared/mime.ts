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

import { Readable } from 'node:stream';

import * as fileType from 'file-type';
import * as mime from 'mime';

const fileNameOverrides: Record<string, string> = {
  jenkinsfile: 'text/x-groovy'
};

// Custom MIME types
mime.define(
  {
    'application/xml': ['drawio'],
    'application/x-typescript': ['ts'],
    'text/plain': ['gitignore'],
    'text/x-clojure': ['clj'],
    'text/x-go': ['go'],
    'text/x-groovy': ['groovy', 'pipeline'],
    'text/x-python': ['py'],
    'text/x-r': ['r'],
    'text/x-ruby': ['rb'],
    'text/x-scala': ['scala'],

    // Jupyter notebooks: https://jupyter.readthedocs.io/en/latest/reference/mimetype.html
    'application/x-ipynb+json': ['ipynb']
  },
  true
);

export function getType(fileName: string): string {
  const type = mime.getType(fileName);
  if (type === null) {
    const fileNameLower = fileName.toLowerCase();
    if (fileNameOverrides[fileNameLower]) {
      return fileNameOverrides[fileNameLower];
    }

    return 'application/unknown';
  }

  return type;
}

/**
 * Async version of getType() which checks the filename and/or Buffer contents.
 *
 * File name, if provided, takes precedence over the buffer.
 */
export async function getTypeAsync({
  fileName,
  buffer,
  stream
}: {
  fileName?: string;
  buffer?: Buffer | null;
  stream?: Readable;
}): Promise<string> {
  if (fileName !== undefined) {
    const type = mime.getType(fileName);

    if (type !== null) {
      return type;
    }

    const fileNameLower = fileName.toLowerCase();
    if (fileNameOverrides[fileNameLower]) {
      return fileNameOverrides[fileNameLower];
    }
  }

  if (buffer !== null && buffer !== undefined) {
    const typeFromBuffer = await fileType.fromBuffer(buffer);
    if (typeFromBuffer !== undefined) {
      return typeFromBuffer.mime;
    }
  }

  if (stream !== undefined) {
    const typeFromStream = await fileType.fromStream(stream);
    if (typeFromStream !== undefined) {
      return typeFromStream.mime;
    }
  }

  return 'application/unknown';
}
