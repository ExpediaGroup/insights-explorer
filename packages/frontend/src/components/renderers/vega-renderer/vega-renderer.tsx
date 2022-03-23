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

import type { BoxProps } from '@chakra-ui/layout';
import { Box } from '@chakra-ui/layout';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { VegaLite } from 'react-vega';

import { looseJsonParse } from '../../../shared/json';
import { isRelativeUrl } from '../../../shared/url-utils';
import { Alert } from '../../alert/alert';

interface Props {
  specString: string;
  transformAssetUri?: ((uri: string, children?: ReactNode, title?: string, alt?: string) => string) | null;
}

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return <Alert error={`Error parsing Vega config: ${error}`} />;
};

function areEqual(prevProps: Props, nextProps: Props): boolean {
  // Only compare the `specString` property to determine whether
  // this component needs to re-render.
  // There's no mechanism for the other properties to change dynamically.
  return prevProps.specString === nextProps.specString;
}

export const VegaRenderer = memo(({ specString, transformAssetUri, ...boxProps }: Props & BoxProps) => {
  const [spec, setSpec] = useState<Record<string, any> | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const specObj = looseJsonParse(specString);

      if (transformAssetUri && specObj.data?.url && isRelativeUrl(specObj.data.url)) {
        specObj.data.url = transformAssetUri(specObj.data.url);
      }

      setSpec({
        width: 'container',
        //height: 'container',
        ...specObj
      });
    } catch (error_: any) {
      setSpec(undefined);
      setError(error_);
    }
  }, [specString, transformAssetUri]);

  return (
    <>
      {spec && (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {/* <ContainerDimensions>
            {({ width, height }) => <Box as={VegaLite} spec={spec} width="100%" height={width / 1.33} {...boxProps} />}
          </ContainerDimensions> */}
          <Box as={VegaLite} spec={spec} width="100%" {...boxProps} />
        </ErrorBoundary>
      )}
      {error && <Alert error="Error parsing Vega spec" />}
    </>
  );
}, areEqual);

export default VegaRenderer;
