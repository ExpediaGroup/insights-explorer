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
import { Bar, Line, Pie, Radar, StackedBar, XY } from 'chart.xkcd-react';
import { useEffect, useState } from 'react';
import ContainerDimensions from 'react-container-dimensions';
import { ErrorBoundary } from 'react-error-boundary';

import { looseJsonParse } from '../../../shared/json';
import { Alert } from '../../alert/alert';

interface Props {
  type: string;
  configString: string;
}

const ChartPicker = ({ type, config }) => {
  switch (type.toLowerCase().trim()) {
    case 'bar': {
      return <Bar config={config} />;
    }
    case 'line': {
      return <Line config={config} />;
    }
    case 'pie': {
      return <Pie config={config} />;
    }
    case 'radar': {
      return <Radar config={config} />;
    }
    case 'stackedbar': {
      return <StackedBar config={config} />;
    }
    case 'xy': {
      return <XY config={config} />;
    }
    default: {
      return null;
    }
  }
};

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return <Alert error={`Error parsing XKCD Chart config: ${error}`} />;
};

export const XkcdChartRenderer = ({ type, configString, ...boxProps }: Props & BoxProps) => {
  const [config, setConfig] = useState<Record<string, any> | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const configObj = looseJsonParse(
        // Replace these constants with the internal values
        configString
          .replaceAll('chartXkcd.config.positionType.upLeft', '1')
          .replaceAll('chartXkcd.config.positionType.upRight', '2')
          .replaceAll('chartXkcd.config.positionType.downLeft', '3')
          .replaceAll('chartXkcd.config.positionType.downRight', '4')
      );
      setConfig(configObj);
    } catch (error_: any) {
      setConfig(undefined);
      setError(error_);
    }
  }, [configString]);

  return (
    <>
      {config && (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Box {...boxProps}>
            <ContainerDimensions>
              <ChartPicker type={type} config={config} />
            </ContainerDimensions>
          </Box>
        </ErrorBoundary>
      )}
      {error && <Alert error={`Error parsing XKCD Chart config: ${error}`} />}
    </>
  );
};

export default XkcdChartRenderer;
