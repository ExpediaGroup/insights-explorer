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

import { Button, Flex, FormControl, FormHelperText } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';

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
  const { control, formState, handleSubmit, reset } = useForm({
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

  const localeOptions = availableLocales.map((locale) => ({ value: locale, label: locale }));
  const detectedLocale = Intl.DateTimeFormat().resolvedOptions().locale;

  return (
    <Card as={Flex} flexDirection="column" p="1rem">
      {isDirty && <Alert info="You have unsaved changes" mb="1rem" />}

      <form onSubmit={handleSubmit(internalSubmit)}>
        <FormControl id="locale" mb="1rem">
          <FormLabel>Locale</FormLabel>
          <Controller
            control={control}
            name="locale"
            render={({ field: { onChange, value } }) => (
              <Select
                inputId="locale"
                defaultValue={{ value: detectedLocale, label: `Detected (${detectedLocale})` }}
                options={localeOptions}
                onChange={(e) => onChange(e.value)}
                value={localeOptions && value && localeOptions.find((l) => l.value === value)}
                placeholder={`Detected (${detectedLocale})`}
                styles={{
                  menu: (base) => ({ ...base, zIndex: 11 }),
                  container: (base) => ({ ...base, width: '100%' }),
                  valueContainer: (base) => ({ ...base, paddingLeft: '10px' }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            )}
          />
          <FormHelperText>The locale setting is used for formatting numbers, dates, etc.</FormHelperText>
        </FormControl>

        <Button mt="0.5rem" variant="frost" isLoading={isSubmitting} type="submit">
          Save
        </Button>
      </form>
    </Card>
  );
};
