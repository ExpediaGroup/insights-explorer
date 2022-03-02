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

import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  VStack
} from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';

import { iconFactoryAs } from '../../../../shared/icon-factory';

export const InsightLinks = ({ insight, form }) => {
  const {
    control,
    register,
    formState: { errors }
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'links'
  });

  return (
    <>
      <FormControl id="insight-links" isInvalid={errors.links !== undefined}>
        <FormLabel>Links</FormLabel>
        <VStack spacing="1rem" align="stretch" justify="stretch">
          {fields.map((field, index) => (
            <Stack key={`links-${index}`} direction={{ base: 'column', '2xl': 'row' }} align="stretch">
              <InputGroup>
                <InputLeftElement
                  pointerEvents="none"
                  children={iconFactoryAs('linkExternal', { color: 'frost.400' })}
                />
                <Input
                  placeholder={`Link`}
                  defaultValue=""
                  errorBorderColor="red.300"
                  {...register(`links.${index}.url`)}
                />
              </InputGroup>
              <HStack>
                <Input
                  placeholder={`Name`}
                  errorBorderColor="red.300"
                  flexBasis="50%%"
                  {...register(`links.${index}.name`)}
                />
                <Input
                  placeholder={`Group (Optional)`}
                  errorBorderColor="red.300"
                  flexBasis="50%"
                  {...register(`links.${index}.group`)}
                />
                <IconButton icon={iconFactoryAs('trash')} onClick={() => remove(index)} aria-label="Remove link" />
              </HStack>
            </Stack>
          ))}
          <Button
            variant="frost"
            onClick={() => append({ group: '', link: '' })}
            rightIcon={iconFactoryAs('linkExternal')}
            aria-label="Add link"
            alignSelf="flex-start"
          >
            Add
          </Button>
        </VStack>

        <FormHelperText>Related links to appear alongside the Insight.</FormHelperText>
      </FormControl>
    </>
  );
};
