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

import { BoxProps, Progress } from '@chakra-ui/react';
import { memo } from 'react';

import { useInsight } from '../../shared/useInsight';
import { Alert } from '../alert/alert';
import { InsightConnectionCard, InsightConnectionCardProps } from '../insight-connection-card/insight-connection-card';

type Props = Omit<InsightConnectionCardProps, 'insightEdge'> & { fullName: string };

export const FetchInsightConnectionCard = memo(
  ({ fullName, options, ...props }: Props & Omit<BoxProps, 'children'>) => {
    const [{ insight, error, fetching }] = useInsight({
      fullName
    });

    if (fetching) {
      return <Progress size="xs" isIndeterminate />;
    }

    if (error) {
      return <Alert error={error} {...props} />;
    } else if (insight === null) {
      return <Alert error={`Insight not found: ${fullName}`} {...props} />;
    } else {
      return <InsightConnectionCard insightEdge={{ node: insight }} options={options} {...props} />;
    }
  }
);
