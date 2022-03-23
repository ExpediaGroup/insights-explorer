/**
 * Copyright 2022 Expedia, Inc.
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
import { Controller } from 'react-hook-form';
import CreatableSelect from 'react-select/creatable';
import { gql, useQuery } from 'urql';

import type { UsersAsAuthorsQuery } from '../../../../models/generated/graphql';
import { iconFactoryAs } from '../../../../shared/icon-factory';

const USERS_QUERY = gql`
  query UsersAsAuthors {
    users {
      id
      email
      displayName
    }
  }
`;

export const InsightAuthors = ({ insight, form }) => {
  const {
    control,
    formState: { errors }
  } = form;

  // Load autocomplete values to populate filters
  const [{ data: userData }] = useQuery<UsersAsAuthorsQuery>({
    query: USERS_QUERY
  });

  const availableAuthors = userData?.users?.map(({ email, displayName }) => ({ value: email, label: displayName }));

  return (
    <>
      <FormControl id="insight-authors" isInvalid={errors.authors !== undefined}>
        <FormLabel>Authors</FormLabel>
        <InputGroup>
          <InputLeftElement pointerEvents="none" children={iconFactoryAs('user', { color: 'frost.400' })} />
          <Controller
            control={control}
            name="authors"
            defaultValue={insight?.config?.authors ?? []}
            render={({ field: { onBlur, onChange, value } }) => (
              <CreatableSelect
                inputId="authors"
                isMulti
                isClearable
                options={availableAuthors}
                onChange={(event) => {
                  let values: string[] = [];
                  if (event != null) {
                    values = event.map((e) => e.value);
                  }
                  onChange(values);
                }}
                value={value?.map((author: string) => ({ value: author, label: author }))}
                styles={{
                  menu: (base) => ({ ...base, zIndex: 11 }),
                  menuPortal: (base) => ({ ...base, zIndex: 11 }),
                  container: (base) => ({ ...base, width: '100%' }),
                  valueContainer: (base) => ({ ...base, paddingLeft: '40px' })
                }}
              />
            )}
          />
        </InputGroup>
        <FormHelperText>
          If provided, this field will overwrite the auto-detected list of Authors.
          <br />
          Specify one or more email addresses.
        </FormHelperText>
      </FormControl>

      <FormControl id="insight-excluded-authors" isInvalid={errors.excludedAuthors !== undefined}>
        <FormLabel>Exclude Authors</FormLabel>
        <InputGroup>
          <InputLeftElement pointerEvents="none" children={iconFactoryAs('user', { color: 'frost.400' })} />
          <Controller
            control={control}
            name="excludedAuthors"
            defaultValue={insight?.config?.excludedAuthors ?? []}
            render={({ field: { onBlur, onChange, value } }) => (
              <CreatableSelect
                inputId="excludedAuthors"
                isMulti
                isClearable
                options={availableAuthors}
                onChange={(event) => {
                  let values: string[] = [];
                  if (event != null) {
                    values = event.map((e) => e.value);
                  }
                  onChange(values);
                }}
                value={value?.map((author: string) => ({ value: author, label: author }))}
                styles={{
                  menu: (base) => ({ ...base, zIndex: 11 }),
                  menuPortal: (base) => ({ ...base, zIndex: 11 }),
                  container: (base) => ({ ...base, width: '100%' }),
                  valueContainer: (base) => ({ ...base, paddingLeft: '40px' })
                }}
              />
            )}
          />
        </InputGroup>
        <FormHelperText>
          Authors specified here will be ignored when auto-detecting authors.
          <br />
          Specify one or more email addresses.
        </FormHelperText>
      </FormControl>
    </>
  );
};
