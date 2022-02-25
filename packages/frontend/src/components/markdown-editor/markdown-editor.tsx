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

import { useColorModeValue } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import { emoji } from 'node-emoji';
import { useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';

import { UploadSingleFileMutation } from '../../models/generated/graphql';
import { useDebounce } from '../../shared/useDebounce';

import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/theme-nord_dark';

let emojiList: Record<string, unknown>[] | undefined = undefined;

const emojiCompleter = {
  identifierRegexps: [/[:]/],
  getCompletions: (editor, session, pos, prefix, callback) => {
    // Only trigger completions after an initial ":"
    if (prefix !== ':') {
      callback(null, []);
      return;
    }

    if (emojiList === undefined) {
      emojiList = Object.keys(emoji).map((key) => {
        const shortcode = `:${key}:`;
        return {
          name: shortcode,
          value: shortcode,
          caption: `${emoji[key]} ${shortcode}`,
          meta: 'emoji',
          score: 1000
        };
      });

      // IEX emoji
      emojiList.push({
        name: ':iex:',
        value: ':iex:',
        caption: `:iex: IEX logo`,
        meta: 'emoji',
        score: 2000
      });
    }

    callback(null, emojiList);
  }
};

interface Props {
  contents: string;
  onContentsChange: (updatedValue: string) => any;
  scrollSync: boolean;
  uploadFile?: (file: File, name: string) => Promise<UploadSingleFileMutation | undefined>;
}

export const MarkdownEditor = ({ contents, onContentsChange, scrollSync, uploadFile }: Props) => {
  const aceTheme = useColorModeValue('chrome', 'nord_dark');

  const [internalValue, setInternalValue] = useState(contents);
  const previousValueRef = useRef(contents);

  const aceEditorRef: any = useRef();

  // Overwrite internal state if external contents change
  useEffect(() => {
    setInternalValue(contents);
  }, [contents]);

  // Adding listener for the aceEditor on 'paste' event
  useEffect(() => {
    async function handlePasteEvent(arg: any) {
      const items = (arg.clipboardData || arg.originalEvent.clipboardData).items;

      // Handle all image types on paste event
      if (items[0].type.startsWith('image/')) {
        const file = items[0].getAsFile();

        // Set the proper image name by generating a random name if it has a default name (eg: 'image.png')
        // or add `<` and `>` characters to the name in case it contains any spaces
        const name = file.name.startsWith('image.')
          ? file.name.replace('image', `pasted-${nanoid().substring(0, 6)}`)
          : file.name;

        // Insert the image with Markdown notation based on the current cursor position
        const cursorPos = aceEditorRef.current.editor.getCursorPosition();
        aceEditorRef.current.editor.session.insert(cursorPos, `![${name}](${name.includes(' ') ? `<${name}>` : name})`);

        if (uploadFile) {
          await uploadFile(file, name);
        }
      }
    }

    if (uploadFile && aceEditorRef && aceEditorRef.current) {
      document.querySelector(`#aceEditor`)?.addEventListener('paste', handlePasteEvent, true);
      return function cleanup() {
        document.querySelector(`#aceEditor`)?.removeEventListener('paste', handlePasteEvent, true);
      };
    }
  });

  function handleScroll(editor: any) {
    if (scrollSync) {
      let lineNumber = editor.getFirstVisibleRow() + 1;
      do {
        const element = document.querySelectorAll(`[data-sourcepos^="${lineNumber}:"]`)[0];
        if (element) {
          element.scrollIntoView({ block: 'start' });
          break;
        }
      } while (--lineNumber > 0);
    }
  }

  // Debounce value changes to avoid too-frequent updates
  useDebounce(
    () => {
      if (internalValue !== previousValueRef.current && internalValue !== contents) {
        previousValueRef.current = internalValue;

        onContentsChange(internalValue);
      }
    },
    25,
    [internalValue]
  );

  return (
    <AceEditor
      name="aceEditor"
      ref={aceEditorRef}
      mode="markdown"
      theme={aceTheme}
      editorProps={{ $blockScrolling: false }}
      value={internalValue}
      onChange={setInternalValue}
      onScroll={handleScroll}
      tabSize={2}
      wrapEnabled={true}
      showPrintMargin={false}
      width="100%"
      minLines={30}
      height={scrollSync ? '70vh' : '100%'}
      setOptions={{
        scrollPastEnd: scrollSync,
        autoScrollEditorIntoView: true,
        enableBasicAutocompletion: [emojiCompleter] as any,
        enableLiveAutocompletion: true,
        enableSnippets: true
      }}
    />
  );
};
