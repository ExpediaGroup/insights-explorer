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

import { FetchActivityList } from '../../../../../../components/activity-list/fetch-activity-list';
import type { User } from '../../../../../../models/generated/graphql';

interface Props {
  user: User;
}

export const UserActivity = ({ user }: Props) => {
  // Hardcode an activity query based on the user's username
  return <FetchActivityList query={`user:${user.userName}`} />;
};
