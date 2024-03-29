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

import { useMemo, useState } from 'react';

import { CodeRendererAsync } from '../code-renderer/code-renderer-async';
import { TableRenderer } from '../table-renderer/table-renderer';

export const JsonRenderer = ({ contents }) => {
  const [error, setError] = useState(undefined);

  const results = useMemo(() => {
    if (contents) {
      try {
        const data = JSON.parse(contents);

        // Assume all the columns are in the first row
        // We could extend this to take a larger sample of data to determine the columns
        const columns = Object.keys(data[0]).map((column) => ({
          Header: column,
          accessor: column
        }));

        return {
          columns,
          data
        };
      } catch (error: any) {
        setError(error);
      }
    }
  }, [contents]);

  if (error) {
    // Fallback to displaying the contents as a code snippet
    return <CodeRendererAsync contents={contents} language="json" />;
  }
  if (results === undefined) {
    return null;
  }

  return <TableRenderer {...results} />;
};
