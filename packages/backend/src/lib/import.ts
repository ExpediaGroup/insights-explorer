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

import { InsightFileAction } from '@iex/models/insight-file-action';
import { ItemType } from '@iex/models/item-type';
import { getLogger } from '@iex/shared/logger';
import isArray from 'lodash/isArray';
import mergeWith from 'lodash/mergeWith';
import { nanoid } from 'nanoid';
import { parse as htmlParse, HTMLElement } from 'node-html-parser';
import TurndownService from 'turndown';
import * as turndownPluginGfm from 'turndown-plugin-gfm';
import Container from 'typedi';

import { DraftDataInput, DraftKey } from '../models/draft';
import { DraftService } from '../services/draft.service';

const logger = getLogger('import');

export type ImportFormat = 'html' | undefined;

export interface ImportRequest {
  title: string;
  url: string;
  contents: string;
  format?: ImportFormat;
  itemType?: ItemType;
  htmlElement?: HTMLElement;
}

export type ConversionFunction = (request: ImportRequest) => DraftDataInput;

export type ImportConverter = {
  name: string;
  predicate: (request: ImportRequest) => boolean;
  convert: ConversionFunction;
};

export function createTurndown(): TurndownService {
  const turndownService = new TurndownService({
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    headingStyle: 'atx'
  });

  turndownService.use(turndownPluginGfm.gfm);

  return turndownService;
}

export const converters: ImportConverter[] = [
  {
    name: 'html-confluence',
    predicate: (request: ImportRequest): boolean => {
      if (request.format !== 'html') {
        return false;
      }

      const confluence = request.htmlElement!.querySelector('#com-atlassian-confluence');
      return confluence != null;
    },
    convert: (request: ImportRequest): DraftDataInput => {
      const turndownService = createTurndown();

      // Title element is an <a> tag
      const titleElement = request.htmlElement!.querySelector('#title-text');
      const mainElement = request.htmlElement!.querySelector('#main-content');

      // Rebuild heading to avoid converting into a link
      const contents = `<h1>${titleElement.innerText}</h1>${mainElement.outerHTML}`;

      const tagElements = request.htmlElement!.querySelectorAll('.aui-label');

      return {
        tags: tagElements.map((tag) => tag.firstChild.innerText),
        files: [
          {
            action: InsightFileAction.MODIFY,
            contents: turndownService.turndown(contents),
            id: nanoid(),
            mimeType: 'text/markdown',
            name: 'README.md',
            path: 'README.md'
          }
        ]
      };
    }
  },
  {
    name: 'html-default',
    predicate: (request) => request.format === 'html',
    convert: (request: ImportRequest): DraftDataInput => {
      const turndownService = createTurndown();
      return {
        files: [
          {
            action: InsightFileAction.MODIFY,
            contents: turndownService.turndown(request.contents),
            id: nanoid(),
            mimeType: 'text/markdown',
            name: 'README.md',
            path: 'README.md'
          }
        ]
      };
    }
  },
  {
    name: 'default',
    predicate: () => true,
    convert: (request: ImportRequest): DraftDataInput => {
      return {
        files: [
          {
            action: InsightFileAction.MODIFY,
            contents: request.contents,
            id: nanoid(),
            mimeType: 'text/markdown',
            name: 'README.md',
            path: 'README.md'
          }
        ]
      };
    }
  }
];

const mergeCustomizer = (objValue: any, srcValue: any) => {
  // Concat arrays together
  if (isArray(objValue)) {
    return [...objValue, ...srcValue];
  }
};

export function convertToDraft(request: ImportRequest): DraftDataInput {
  // Parse HTML nodes once to avoid duplication of effort
  if (request.format === 'html') {
    request.htmlElement = htmlParse(request.contents);
  }

  const converter = converters.find((converter) => converter.predicate(request));
  if (converter === undefined) {
    throw new Error('Cannot find a matching converter for this import request');
  }

  logger.debug(`Importing using the '${converter.name}' converter`);

  // Convert request contents
  const draftData = converter.convert(request);

  const defaultDraftData: DraftDataInput = {
    name: request.title,
    description: 'Imported from ' + request.url,
    tags: ['imported'],
    creation: {
      importedFrom: request.url
    },
    commitMessage: 'Imported from ' + request.url,
    initializedTemplate: true,
    itemType: request.itemType || ItemType.INSIGHT
  };

  // Merge converted draft contents with the default metadata
  const combinedDraftData = mergeWith(defaultDraftData, draftData, mergeCustomizer);

  const readmeFile = combinedDraftData.files?.find((f) => f.path === 'README.md');

  if (readmeFile) {
    readmeFile.contents =
      `<!-- This file was automatically converted from ${request.format} to markdown. -->\n` +
      `<!-- Please review it for any conversion errors. -->\n\n` +
      readmeFile.contents;

    readmeFile.contents = readmeFile.contents.replaceAll('\u00A0', ' ');
  }

  return combinedDraftData;
}

export async function importToNewDraft(request: ImportRequest): Promise<DraftKey> {
  logger.info(`Importing web page ${request.url}`);

  const draftService = Container.get(DraftService);
  const draftKey = draftService.newDraftKey();

  const draftData = convertToDraft(request);

  // Create new Draft
  await draftService.upsertDraft(
    {
      draftKey,
      draftData
    },
    // We don't know the creator, so set to null
    null
  );

  return draftKey;
}
