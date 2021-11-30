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

import { Box, Button, Flex, FormControl, FormHelperText, Select } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { gql, useQuery } from 'urql';

import { Alert } from '../../../../components/alert/alert';
import { Card } from '../../../../components/card/card';
import { FormLabel } from '../../../../components/form-label/form-label';
import { TemplatesQuery, User } from '../../../../models/generated/graphql';

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
  const { formState, handleSubmit, register, reset } = useForm({
    mode: 'onBlur',
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

  if (templatesData == null) {
    return <Box></Box>;
  }

  return (
    <Card as={Flex} flexDirection="column" p="1rem">
      {isDirty && <Alert info="You have unsaved changes" mb="1rem" />}

      <form onSubmit={handleSubmit(internalSubmit)}>
        <FormControl id="defaultTemplateId" mb="1rem">
          <FormLabel>Default Template</FormLabel>
          <Select
            defaultValue={defaultTemplateId}
            errorBorderColor="red.300"
            {...register('defaultTemplateId', { required: false })}
          >
            <option key="detected" value="">
              None
            </option>
            {templatesData.templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
          <FormHelperText>The default template is automatically used when creating new Insights.</FormHelperText>
        </FormControl>

        <Button mt="0.5rem" variant="frost" isLoading={isSubmitting} type="submit">
          Save
        </Button>
      </form>
    </Card>
  );
};
