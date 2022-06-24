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

import { Button, Flex, FormControl, FormHelperText, Heading, Switch, Text, VStack } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';

import { Alert } from '../../../../components/alert/alert';
import { Card } from '../../../../components/card/card';
import { FormLabel } from '../../../../components/form-label/form-label';
import type { User } from '../../../../models/generated/graphql';
import { availableLocales } from '../../../../shared/date-utils';

interface Props {
  user: User;
  onSubmit: (values) => void | Promise<any>;
  isSubmitting: boolean;
}

export const SystemSettings = ({ user, onSubmit, isSubmitting }: Props) => {
  const { locale, featureFlags } = user;
  const { control, formState, handleSubmit, reset } = useForm({
    mode: 'onBlur',
    defaultValues: {
      locale,
      featureFlags
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
      <VStack spacing="1rem" align="stretch">
        {isDirty && <Alert info="You have unsaved changes" />}

        <form onSubmit={handleSubmit(internalSubmit)}>
          <VStack spacing="1rem" align="stretch">
            <Heading as="h2" size="md">
              Localization
            </Heading>
            <FormControl id="locale">
              <FormLabel>Locale</FormLabel>
              <Controller
                control={control}
                name="locale"
                render={({ field: { onChange, value } }) => (
                  <Select
                    inputId="locale"
                    defaultValue={{ value: detectedLocale, label: `Detected (${detectedLocale})` }}
                    options={localeOptions}
                    onChange={(e) => {
                      if (e) {
                        onChange(e.value);
                      }
                    }}
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

            <Heading as="h2" size="md" pt="1rem">
              Feature Flags
            </Heading>

            <Text fontSize="sm">
              Feature flags allow you to enable or disable specific features in the application.
            </Text>

            <FormControl>
              <Flex display="flex" alignItems="center">
                <FormLabel htmlFor="feature-flag-dark-mode" mb="0">
                  Enable Dark Mode
                </FormLabel>
                <Controller
                  control={control}
                  name="featureFlags.darkMode"
                  render={({ field: { onChange, value } }) => (
                    <Switch
                      id="feature-flag-dark-mode"
                      colorScheme="nord8"
                      isChecked={value ?? false}
                      onChange={onChange}
                    />
                  )}
                />
              </Flex>
              <FormHelperText>Enables a toggle between light and dark mode.</FormHelperText>
            </FormControl>
          </VStack>

          <Button mt="2rem" variant="frost" isLoading={isSubmitting} type="submit">
            Save
          </Button>
        </form>
      </VStack>
    </Card>
  );
};
