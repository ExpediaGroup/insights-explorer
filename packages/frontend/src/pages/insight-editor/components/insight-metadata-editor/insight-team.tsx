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
import { useSelector } from 'react-redux';
import CreatableSelect from 'react-select/creatable';
import titleize from 'titleize';
import { gql, useQuery } from 'urql';

import { Link } from '../../../../components/link/link';
import { AutocompleteInsightTeamQuery } from '../../../../models/generated/graphql';
import { iconFactoryAs } from '../../../../shared/icon-factory';
import { RootState } from '../../../../store/store';

const AUTOCOMPLETE_QUERY = gql`
  query AutocompleteInsightTeam {
    autocomplete {
      teams {
        value
        occurrences
      }
    }
  }
`;
export const InsightTeam = ({ insight, form }) => {
  const {
    control,
    formState: { errors }
  } = form;
  const { userInfo } = useSelector((state: RootState) => state.user);

  // Load autocomplete values to populate filters
  const [{ data: autocompleteData }] = useQuery<AutocompleteInsightTeamQuery>({
    query: AUTOCOMPLETE_QUERY
  });

  const availableTeams = autocompleteData?.autocomplete.teams?.map(({ value }) => ({ value, label: value })) ?? [];

  const itemType = useWatch({
    control,
    name: 'itemType',
    defaultValue: insight?.itemType
  });

  return (
    <FormControl id="insight-team" isInvalid={errors.team !== undefined}>
      <FormLabel>Team</FormLabel>
      <InputGroup>
        <InputLeftElement pointerEvents="none" children={iconFactoryAs('team', { color: 'frost.400' })} />
        <Controller
          control={control}
          name="metadata.team"
          defaultValue={userInfo?.team ?? ''}
          render={({ field: { onChange, value } }) => (
            <CreatableSelect
              inputId="team"
              options={availableTeams}
              onChange={(e) => onChange(e.value)}
              value={{ value, label: value }}
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
        Which team owns this {titleize(itemType)}? If your{' '}
        <Link to="/settings/profile" isExternal={true}>
          Profile
        </Link>{' '}
        includes your Team, it will be auto-filled here.
      </FormHelperText>
    </FormControl>
  );
};
