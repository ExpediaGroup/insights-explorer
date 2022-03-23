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

import type { BoxProps } from '@chakra-ui/react';
import { Progress } from '@chakra-ui/react';
import { memo } from 'react';

import { filterContentByLines } from '../../../shared/lines';
import { useFetch } from '../../../shared/useFetch';
import { Alert } from '../../alert/alert';

import type { CodeRendererProps } from './code-renderer';
import { CodeRenderer } from './code-renderer';

type Props = CodeRendererProps & {
  url: string;
  lines?: string;
};

export const FetchCodeRenderer = memo(({ url, lines, ...props }: Props & BoxProps) => {
  const { data, error, fetching } = useFetch({
    url
  });

  if (fetching) {
    return <Progress size="xs" isIndeterminate />;
  }

  const [filteredData, startingLineNumber] = filterContentByLines(data || '', lines);

  return (
    <>
      {error && <Alert error={error} />}
      {data && <CodeRenderer contents={filteredData} startingLineNumber={startingLineNumber} {...props} />}
    </>
  );
});
