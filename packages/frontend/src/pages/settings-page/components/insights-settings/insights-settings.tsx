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

import { Box, Button, Flex, FormControl, FormHelperText } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';

import { gql, useQuery } from 'urql';

import { Alert } from '../../../../components/alert/alert';
import { Card } from '../../../../components/card/card';
import { FormLabel } from '../../../../components/form-label/form-label';
import type { TemplatesQuery, User } from '../../../../models/generated/graphql';

const TEMPLATES_QUERY = gql`
  query Templates {
    templates {
      id
      fullName
      name
    }
  }
`;

interface Props {
  user: User;
  onSubmit: (values) => void | Promise<any>;
  isSubmitting: boolean;
}

export const InsightsSettings = ({ user, onSubmit, isSubmitting }: Props) => {
  const { defaultTemplateId } = user;
  const { control, formState, handleSubmit, reset } = useForm({
    mode: 'onChange',
    defaultValues: {
      defaultTemplateId
    }
  });
  const { isDirty } = formState;

  // Load templates list
  const [{ data: templatesData }] = useQuery<TemplatesQuery>({
    query: TEMPLATES_QUERY
  });

  const internalSubmit = async (values) => {
    await onSubmit(values);
    reset(values);
  };

  const templateOptions =
    templatesData?.templates.map((template) => ({ value: template.id, label: template.name })) ?? [];

  if (templatesData == null) {
    return <Box></Box>;
  }

  return (
    <Card as={Flex} flexDirection="column" p="1rem">
      {isDirty && <Alert info="You have unsaved changes" mb="1rem" />}

      <form onSubmit={handleSubmit(internalSubmit)}>
        <FormControl id="defaultTemplateId" mb="1rem">
          <FormLabel>Default Template</FormLabel>
          <Controller
            control={control}
            name="defaultTemplateId"
            render={({ field: { onChange, value } }) => (
              <Select
                inputId="defaultTemplateId"
                defaultValue={templateOptions.find((t) => t.value === defaultTemplateId)}
                options={templateOptions}
                onChange={(e) => (e === null ? onChange('') : onChange(e.value))}
                value={templateOptions && value && templateOptions.find((t) => t.value === value)}
                isClearable={true}
                styles={{
                  menu: (base) => ({ ...base, zIndex: 11 }),
                  container: (base) => ({ ...base, width: '100%' }),
                  valueContainer: (base) => ({ ...base, paddingLeft: '10px' }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            )}
          />
          <FormHelperText>The default template is automatically used when creating new Insights.</FormHelperText>
        </FormControl>

        <Button mt="0.5rem" variant="frost" isLoading={isSubmitting} type="submit">
          Save
        </Button>
      </form>
    </Card>
  );
};
