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

import type { InsightEdge } from '../../models/generated/graphql';
import type { SearchOptions } from '../../store/search.slice';

import { CompactInsightCard } from './components/compact-insight-card/compact-insight-card';
import { DefaultInsightCard } from './components/default-insight-card/default-insight-card';
import { SquareInsightCard } from './components/square-insight-card/square-insight-card';

export interface InsightConnectionCardProps {
  insightEdge: InsightEdge;
  options: SearchOptions;
}

export const InsightConnectionCard = ({ insightEdge, options, ...props }: InsightConnectionCardProps & BoxProps) => {
  switch (options.layout) {
    case 'square': {
      return <SquareInsightCard insightEdge={insightEdge} options={options} {...props} />;
    }
    case 'compact': {
      return <CompactInsightCard insightEdge={insightEdge} options={options} {...props} />;
    }
    case 'default':
    default: {
      return <DefaultInsightCard insightEdge={insightEdge} options={options} {...props} />;
    }
  }
};
