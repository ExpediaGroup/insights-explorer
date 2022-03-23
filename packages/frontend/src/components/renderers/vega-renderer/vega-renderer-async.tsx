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
import { lazy, Suspense } from 'react';

const VegaRenderer = lazy(() => import(/* webpackChunkName: "vega-renderer" */ './vega-renderer'));

export const VegaRendererAsync = (
  props: { specString: string; transformAssetUri: (uri: string) => string } & BoxProps
) => {
  return (
    <div>
      <Suspense fallback={<Progress size="xs" isIndeterminate />}>
        <VegaRenderer {...props} />
      </Suspense>
    </div>
  );
};
