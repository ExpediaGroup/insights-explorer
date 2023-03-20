/**
 * Copyright 2023 Expedia, Inc.
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

import { Progress } from '@chakra-ui/react';
import { lazy, Suspense } from 'react';

const CodeRenderer = lazy(() => import('./code-renderer'));

export const CodeRendererAsync = (props: any) => {
  return (
    <Suspense fallback={<Progress size="xs" isIndeterminate />}>
      <CodeRenderer {...props} />
    </Suspense>
  );
};
