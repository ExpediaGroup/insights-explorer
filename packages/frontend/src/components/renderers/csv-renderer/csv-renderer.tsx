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

import Papa from 'papaparse';
import { useMemo } from 'react';

import { TableRenderer } from '../table-renderer/table-renderer';

export const CsvRenderer = ({ contents }) => {
  const results = useMemo(() => {
    if (contents) {
      // Parse CSV file to extract columns and data
      const { data, meta } = Papa.parse<any>(contents, { header: true });

      const columns = meta.fields?.map((column) => ({
        Header: column,
        accessor: column
      }));

      return {
        columns,
        data
      };
    }
  }, [contents]);

  if (results === undefined) {
    return null;
  }

  return <TableRenderer {...results} />;
};
