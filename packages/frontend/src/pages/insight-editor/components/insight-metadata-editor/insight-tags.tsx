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

import { FormControl, FormHelperText, FormLabel, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { Controller, useWatch } from 'react-hook-form';
import CreatableSelect from 'react-select/creatable';
import titleize from 'titleize';
import { gql, useQuery } from 'urql';

import type { AutocompleteInsightTagsQuery } from '../../../../models/generated/graphql';
import { iconFactoryAs } from '../../../../shared/icon-factory';

const AUTOCOMPLETE_QUERY = gql`
  query AutocompleteInsightTags {
    autocomplete {
      tags {
        value
        occurrences
      }
    }
  }
`;

export const InsightTags = ({ insight, form }) => {
  const {
    control,
    formState: { errors }
  } = form;

  // Load autocomplete values to populate filters
  const [{ data: autocompleteData }] = useQuery<AutocompleteInsightTagsQuery>({
    query: AUTOCOMPLETE_QUERY
  });

  const availableTags = autocompleteData?.autocomplete.tags?.map(({ value }) => ({ value, label: value }));

  const itemType = useWatch({
    control,
    name: 'itemType',
    defaultValue: insight?.itemType
  });

  return (
    <FormControl id="insight-tags" isInvalid={errors.tags !== undefined}>
      <FormLabel>Tags</FormLabel>
      <InputGroup>
        <InputLeftElement pointerEvents="none" children={iconFactoryAs('tags', { color: 'frost.400' })} />
        <Controller
          control={control}
          name="tags"
          defaultValue={[]}
          render={({ field: { onBlur, onChange, value } }) => (
            <CreatableSelect
              inputId="tags"
              isMulti
              isClearable
              options={availableTags}
              onChange={(event) => {
                let tags: string[] = [];
                if (event != null) {
                  tags = event.map((e) => e.value.trim().toLowerCase().replaceAll(/\s/g, '-'));
                }
                onChange(tags);
              }}
              value={value.map((tag: string) => ({ value: tag, label: tag }))}
              menuPortalTarget={document.body}
              styles={{
                container: (base) => ({ ...base, width: '100%' }),
                valueContainer: (base) => ({ ...base, paddingLeft: '40px' })
              }}
            />
          )}
        />
      </InputGroup>
      <FormHelperText>Tags to associate with this {titleize(itemType)}</FormHelperText>
    </FormControl>
  );
};
