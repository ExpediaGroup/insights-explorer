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

import { DateRange } from '../../../../../../components/date-range/date-range';
import { SidebarStack } from '../../../../../../components/sidebar-stack/sidebar-stack';
import { SearchCompoundRange } from '../../../../../../shared/search';

/**
 * Date range filter component.
 */
export const DateStack = ({ filterKey, heading, searchClauses, setRange, removeRange }) => {
  const compoundRanges = searchClauses.filter(
    (clause) => clause instanceof SearchCompoundRange && clause.key === filterKey
  ) as SearchCompoundRange[];

  const compoundRange = compoundRanges.length > 0 ? compoundRanges[0] : undefined;

  const onChange = (start: string, end: string) => {
    setRange(filterKey, start, end);
  };

  const onClear = () => {
    removeRange(filterKey);
  };

  return (
    <SidebarStack heading={heading}>
      <DateRange
        id={heading.replace(' ', '-')}
        startDate={compoundRange?.from}
        endDate={compoundRange?.to}
        onChange={onChange}
        onClear={onClear}
        aria-label={`Date Range dialog for ${heading}`}
      />
    </SidebarStack>
  );
};
