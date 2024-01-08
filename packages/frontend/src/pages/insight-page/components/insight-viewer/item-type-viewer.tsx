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

import type { Insight, User } from '../../../../models/generated/graphql';

import { InsightViewer } from './insight-viewer';
import { PageViewer } from './page-viewer';

export interface ItemTypeViewerProps {
  insight: Insight;
  isExport: boolean;
  nextInsight?: Pick<Insight, 'id' | 'name' | 'fullName' | 'itemType'>;
  previousInsight?: Pick<Insight, 'id' | 'name' | 'fullName' | 'itemType'>;
  onClone: () => Promise<boolean>;
  onDelete: (archiveRepo: boolean) => Promise<boolean>;
  onFetchLikedBy: (insightId?: string) => Promise<User[]>;
  onLike: (liked: boolean) => Promise<boolean>;
}

export const ItemTypeViewer = ({ ...props }: ItemTypeViewerProps) => {
  switch (props.insight.itemType) {
    case 'page': {
      return <PageViewer {...props} />;
    }
    case 'insight':
    case 'template':
    default: {
      return <InsightViewer {...props} />;
    }
  }
};
