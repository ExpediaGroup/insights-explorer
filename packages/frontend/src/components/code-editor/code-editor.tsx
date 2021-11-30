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
import { useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/theme-nord_dark';
import 'ace-builds/webpack-resolver';

import { useDebounce } from '../../shared/useDebounce';

interface Props {
  contents: string;
  language?: string;
  onContentsChange: (updatedValue: string) => any;
  readOnly?: boolean;
}

export const CodeEditor = ({ contents, language, onContentsChange, readOnly = false }: Props) => {
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
      mode={language}
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
      readOnly={readOnly}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true
      }}
    />
  );
};
