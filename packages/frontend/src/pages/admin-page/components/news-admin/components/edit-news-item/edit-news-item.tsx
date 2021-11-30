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

import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Tooltip,
  VStack
} from '@chakra-ui/react';
import { DateTime } from 'luxon';
import { Controller, useForm } from 'react-hook-form';

import { Card } from '../../../../../../components/card/card';
import { DatePicker } from '../../../../../../components/date-picker/date-picker';
import { MarkdownSplitEditor } from '../../../../../../components/markdown-split-editor/markdown-split-editor';
import { NewsFieldsFragment } from '../../../../../../models/generated/graphql';
import { iconFactoryAs } from '../../../../../../shared/icon-factory';

export const EditNewsItem = ({
  edge,
  isNew,
  isSubmitting,
  onCancel,
  onDelete,
  onSubmit
}: {
  edge?: { node: NewsFieldsFragment };
  isNew?: boolean;
  isSubmitting: boolean;
  onCancel?: any;
  onDelete?: any;
  onSubmit: any;
}) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      summary: edge?.node.summary,
      activeAt: edge?.node.activeAt,
      body: edge?.node.body
    }
  });

  return (
    <Card key={edge?.node.id}>
      <VStack as="form" onSubmit={handleSubmit(onSubmit)} align="stretch">
        <FormControl id="summary" isRequired isInvalid={errors.summary !== undefined}>
          <FormLabel>Summary</FormLabel>
          <Input
            placeholder="Summary"
            defaultValue={edge?.node.summary}
            errorBorderColor="red.300"
            {...register('summary', { required: true })}
          />
        </FormControl>

        <FormControl id="activeAt" isRequired isInvalid={errors.activeAt !== undefined}>
          <FormLabel>Active At</FormLabel>
          <Controller
            control={control}
            name="activeAt"
            rules={{ required: true }}
            defaultValue={edge?.node.activeAt}
            render={({ field: { onChange, value } }) => (
              <DatePicker
                selectedDate={value == null ? undefined : DateTime.fromISO(value).toJSDate()}
                onChange={(newValue) => onChange(DateTime.fromJSDate(newValue).toISO())}
                showTimeInput={true}
                dateFormat="MM/dd/yyyy h:mm aa"
              />
            )}
          />
        </FormControl>

        <FormControl id="body" isRequired isInvalid={errors.body !== undefined}>
          <FormLabel>Body</FormLabel>
          <Controller
            control={control}
            name="body"
            rules={{ required: true }}
            defaultValue={edge?.node.body}
            render={({ field: { onChange } }) => (
              <MarkdownSplitEditor baseLinkUrl="/" onChange={onChange} contents={edge?.node.body ?? ''} mt="-1rem" />
            )}
          />
          <FormHelperText>Markdown-enabled news item contents.</FormHelperText>
        </FormControl>

        <HStack align="center" justify="flex-end">
          <Button size="sm" width={{ base: '100%', md: 'unset' }} variant="frost" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            size="sm"
            width={{ base: '100%', md: 'unset' }}
            variant="frost"
            isLoading={isSubmitting}
            type="submit"
          >
            Save
          </Button>

          <Tooltip label="Delete News" aria-label="Delete News">
            <IconButton
              variant="solid"
              size="sm"
              _hover={{ backgroundColor: 'aurora.100' }}
              aria-label="Delete News"
              icon={iconFactoryAs('trash')}
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) {
                  onDelete();
                }
              }}
              isLoading={isSubmitting}
            />
          </Tooltip>
        </HStack>
      </VStack>
    </Card>
  );
};
