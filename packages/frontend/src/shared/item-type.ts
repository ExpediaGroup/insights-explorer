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

export const getItemType = (itemType: string) => {
  switch ((itemType ?? 'insight').toLowerCase()) {
    case 'template': {
      return { iconKey: 'template', color: 'nord15.500' };
    }

    case 'page': {
      return { iconKey: 'page', color: 'nord12.500' };
    }

    case 'insight':
    default: {
      return { iconKey: 'insight', color: 'nord14.500' };
    }
  }
};

export enum ItemType {
  INSIGHT = 'insight',
  TEMPLATE = 'template',
  PAGE = 'page'
}
