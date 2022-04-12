/**
 * Copyright 2022 Expedia, Inc.
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

import { useEffect, useRef } from 'react';
import { useFilePicker as ufp } from 'use-file-picker';

export const useFilePicker = ({ onFilesPicked }): [() => void, Record<string, any>] => {
  const previousFile = useRef<any | undefined>(undefined);
  const [openFileSelector, { loading, errors, plainFiles, clear }] = ufp({
    multiple: true,
    maxFileSize: 100, // in MB
    limitFilesConfig: { max: 10 },
    readFilesContent: true
  });

  useEffect(() => {
    if (previousFile.current != plainFiles && plainFiles.length > 0) {
      previousFile.current = plainFiles;
      onFilesPicked(plainFiles);
      clear();
    }
  }, [clear, onFilesPicked, plainFiles]);

  return [
    openFileSelector,
    {
      loading,
      errors
    }
  ];
};
