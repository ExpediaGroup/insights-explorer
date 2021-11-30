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
import { emoji } from 'node-emoji';
import { useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/theme-nord_dark';

import { useDebounce } from '../../shared/useDebounce';

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
}

export const MarkdownEditor = ({ contents, onContentsChange }: Props) => {
  const aceTheme = useColorModeValue('chrome', 'nord_dark');

  const [internalValue, setInternalValue] = useState(contents);
  const previousValueRef = useRef(contents);

  // Overwrite internal state if external contents change
  useEffect(() => {
    setInternalValue(contents);
  }, [contents]);

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
      mode="markdown"
      theme={aceTheme}
      editorProps={{ $blockScrolling: true }}
      value={internalValue}
      onChange={setInternalValue}
      tabSize={2}
      wrapEnabled={true}
      showPrintMargin={false}
      width="100%"
      minLines={30}
      maxLines={Infinity}
      setOptions={{
        enableBasicAutocompletion: [emojiCompleter] as any,
        enableLiveAutocompletion: true,
        enableSnippets: true
      }}
    />
  );
};
