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

import { FormControl, FormHelperText, FormLabel } from '@chakra-ui/react';
import { DateTime } from 'luxon';
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import { DatePicker } from '../../../../components/date-picker/date-picker';

export const PublishedDate = ({ insight, form }) => {
  const { register, setValue } = form;

  useEffect(() => {
    register('metadata.publishedDate');
  }, [register]);

  const publishedDate = useWatch({
    control: form.control,
    name: 'metadata.publishedDate',
    defaultValue: insight.metadata?.publishedDate
  });

  const onChange = (selectedDate) => {
    let publishedDate: string | null;
    try {
      publishedDate = DateTime.fromJSDate(selectedDate).toISODate();
    } catch (error: any) {
      publishedDate = null;
    }
    setValue('metadata.publishedDate', publishedDate);
  };

  return (
    <FormControl id="insight-published-date" mb="1rem">
      <FormLabel>Published Date</FormLabel>
      <DatePicker
        id="insight-published-date"
        selectedDate={publishedDate == null ? undefined : DateTime.fromISO(publishedDate).toJSDate()}
        onChange={onChange}
        isClearable={true}
      />
      <FormHelperText>Date Insight was Presented to Customer.</FormHelperText>
    </FormControl>
  );
};
