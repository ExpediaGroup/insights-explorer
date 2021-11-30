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

import { Checkbox } from '@chakra-ui/react';
import titleize from 'titleize';

import { SidebarStack } from '../../../../../../components/sidebar-stack/sidebar-stack';
import { ActivityType } from '../../../../../../models/generated/graphql';
import { SearchClause, SearchMultiTerm, SearchTerm } from '../../../../../../shared/search';

// This is a manually-curated subset of all Activity Types
// E.g. we don't need to allow users to filter for LOGIN activities
const activityTypes = [
  ActivityType.CreateComment,
  ActivityType.CreateInsight,
  ActivityType.DeleteComment,
  ActivityType.DeleteInsight,
  ActivityType.EditComment,
  ActivityType.EditInsight,
  ActivityType.LikeComment,
  ActivityType.LikeInsight,
  ActivityType.UpdateProfile
].map((value) => {
  return { value, label: titleize(value.replace('_', ' ')) };
});

const getActivityTypes = (searchClauses: SearchClause[]) => {
  const selected = activityTypes.reduce((acc, i) => {
    acc[i.value] = false;
    return acc;
  }, {});

  // Terms like `activityType:insight`
  searchClauses
    .filter((clause): clause is SearchTerm => clause instanceof SearchTerm && clause.key === 'activityType')
    .forEach((term: SearchTerm) => {
      selected[term.value] = true;
    });

  // Multi terms like `activityType:{insight,page}`
  searchClauses
    .filter((clause): clause is SearchMultiTerm => clause instanceof SearchMultiTerm && clause.key === 'activityType')
    .forEach((term: SearchMultiTerm) => {
      term.values.forEach((v) => (selected[v] = true));
    });

  return selected;
};

interface Props {
  searchClauses: SearchClause[];
  setTerms: any;
}

export const ActivityTypeStack = ({ searchClauses, setTerms }: Props) => {
  const selectedActivityTypes = getActivityTypes(searchClauses);

  const onChange = (activityType: string, selected: boolean) => {
    selectedActivityTypes[activityType] = selected;
    const values = Object.entries(selectedActivityTypes)
      .filter(([activityType, value]) => value === true)
      .map(([activityType]) => activityType);

    setTerms('activityType', values);
  };

  return (
    <SidebarStack heading="Activity Type">
      {activityTypes.map((activityType) => {
        return (
          <Checkbox
            key={activityType.value}
            isChecked={selectedActivityTypes[activityType.value]}
            onChange={(e) => onChange(activityType.value, e.target.checked)}
          >
            {activityType.label}
          </Checkbox>
        );
      })}
    </SidebarStack>
  );
};
