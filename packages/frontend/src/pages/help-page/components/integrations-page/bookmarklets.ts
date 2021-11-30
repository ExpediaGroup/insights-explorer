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

const getApiUrl = () => {
  if (window.location.origin === 'http://localhost:3000') {
    return 'http://localhost:3001';
  }

  return window.location.origin;
};

const getHtml = `function getHtml () {
    var range;
    if (document.selection && document.selection.createRange) {
      range = document.selection.createRange();
      return range.htmlText;
    }
    else if (window.getSelection) {
      var selection = window.getSelection();
      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
        const clonedSelection = range.cloneContents();
        const div = document.createElement('div');
        div.appendChild(clonedSelection);
        const html = div.innerHTML;
        if (html !== '') {
          return html;
        }
      }
    }
    return document.body.outerHTML;
  }`;

export const importBookmarkletBase = (finale: string) => `javascript:(function () {
    ${getHtml}
    fetch('${getApiUrl()}/api/v1/import', {
      method: 'post',
      body: JSON.stringify({
        url: window.location.href,
        title: document.title,
        contents: getHtml(),
        format: 'html'
      }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        ${finale}
      });
  })();`;

export const importBookmarklet = () =>
  importBookmarkletBase(`window.location.href = '${window.location.origin}/edit/' + data.draftKey;`);

export const importBookmarkletNewWindow = () =>
  importBookmarkletBase(`window.open('${window.location.origin}/edit/' + data.draftKey, '_blank');`);
