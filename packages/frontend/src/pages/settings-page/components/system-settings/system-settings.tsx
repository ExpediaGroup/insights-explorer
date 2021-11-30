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

import { Button, Flex, FormControl, FormHelperText, Select } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Alert } from '../../../../components/alert/alert';
import { Card } from '../../../../components/card/card';
import { FormLabel } from '../../../../components/form-label/form-label';
import { User } from '../../../../models/generated/graphql';
import { availableLocales } from '../../../../shared/date-utils';

interface Props {
  user: User;
  onSubmit: (values) => void | Promise<any>;
  isSubmitting: boolean;
}

export const SystemSettings = ({ user, onSubmit, isSubmitting }: Props) => {
  const { locale } = user;
  const { formState, handleSubmit, register, reset } = useForm({
    mode: 'onBlur',
    defaultValues: {
      locale
    }
  });
  const { isDirty } = formState;

  const internalSubmit = async (values) => {
    await onSubmit(values);
    reset(values);
  };

  const detectedLocale = Intl.DateTimeFormat().resolvedOptions().locale;

  return (
    <Card as={Flex} flexDirection="column" p="1rem">
      {isDirty && <Alert info="You have unsaved changes" mb="1rem" />}

      <form onSubmit={handleSubmit(internalSubmit)}>
        <FormControl id="locale" mb="1rem">
          <FormLabel>Locale</FormLabel>
          <Select defaultValue={locale} errorBorderColor="red.300" {...register('locale', { required: false })}>
            <option key="detected" value="">
              Detected ({detectedLocale})
            </option>
            {availableLocales.map((locale) => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </Select>
          <FormHelperText>The locale setting is used for formatting numbers, dates, etc.</FormHelperText>
        </FormControl>

        <Button mt="0.5rem" variant="frost" isLoading={isSubmitting} type="submit">
          Save
        </Button>
      </form>
    </Card>
  );
};
