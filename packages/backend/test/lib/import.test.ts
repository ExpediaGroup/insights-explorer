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

import { convertToDraft, ImportRequest } from '../../src/lib/import';

describe('import', () => {
  describe('convertToMarkdown', () => {
    test('Simple HTML', () => {
      const html = '<h1>Hello</h1><p>This is amazing!</p>';
      const expected = `<!-- This file was automatically converted from html to markdown. -->
<!-- Please review it for any conversion errors. -->

# Hello

This is amazing!`;
      const request: ImportRequest = { format: 'html', contents: html, title: 'Simple', url: 'https://uri' };
      const draft = convertToDraft(request);

      expect(draft.files![0].contents).toBe(expected);
      expect(draft.commitMessage).toBe(`Imported from ${request.url}`);
    });

    test('Unicode non-breaking space', () => {
      const html = '<h1>Hello</h1><p>This is' + String.fromCodePoint(160) + 'amazing!</p>';
      const expected = `<!-- This file was automatically converted from html to markdown. -->
<!-- Please review it for any conversion errors. -->

# Hello

This is amazing!`;
      const request: ImportRequest = { format: 'html', contents: html, title: 'Simple', url: 'https://uri' };
      const draft = convertToDraft(request);

      expect(draft.files![0].contents).toBe(expected);
      expect(draft.commitMessage).toBe(`Imported from ${request.url}`);
    });

    test('Confluence', () => {
      const html = `
      <body id="com-atlassian-confluence" class="theme-default view-blog-post aui-layout aui-theme-default synchrony-active" data-aui-version="8.3.5">
        <h1 id="title-text" class="with-breadcrumbs" style="display: block;">
          <a href="/display/blog">Hello</a>
        </h1>
        <div id="main-content" class="wiki-content">
          <div class="wiki-content">
            <p>This is amazing!</p>
          </div>
        </div>
        <ul class="label-list label-list-right  has-pen">
          <li class="aui-label " data-label-id="1573028061"><a class="aui-label-split-main" href="/label/~test/npm" rel="tag">npm</a></li>
          <li class="aui-label " data-label-id="644022274"><a class="aui-label-split-main" href="/label/~test/docker" rel="tag">docker</a></li>
          <li class="aui-label " data-label-id="969"><a class="aui-label-split-main" href="/label/~test/tech" rel="tag">tech</a></li>
          <li class="labels-edit-container">
            <a href="#" class="show-labels-editor" title="Edit Labels (Type 'l')">
              <span class="aui-icon aui-icon-small aui-iconfont-devtools-tag-small">Edit Labels</span>
            </a>
          </li>
        </ul>
      </body>`;
      const expected = `<!-- This file was automatically converted from html to markdown. -->
<!-- Please review it for any conversion errors. -->

# Hello

This is amazing!`;
      const request: ImportRequest = { format: 'html', contents: html, title: 'Confluence', url: 'https://uri' };
      const draft = convertToDraft(request);

      expect(draft.files![0].contents).toBe(expected);
      expect(draft.tags).toEqual(['imported', 'npm', 'docker', 'tech']);
      expect(draft.commitMessage).toBe(`Imported from ${request.url}`);
      expect(draft.creation?.importedFrom).toBe(request.url);
    });
  });
});
