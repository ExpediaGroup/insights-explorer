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
  Collapse,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Switch,
  Text,
  useDisclosure,
  VStack
} from '@chakra-ui/react';
import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import Select from 'react-select';
import titleize from 'titleize';
import { gql, useQuery } from 'urql';

import { Alert } from '../../../../components/alert/alert';
import type { Insight } from '../../../../models/generated/graphql';
import { formatFormError } from '../../../../shared/form-utils';
import { iconFactory, iconFactoryAs } from '../../../../shared/icon-factory';
import { ItemType } from '../../../../shared/item-type';
import type { DraftForm } from '../../draft-form';

import { InsightAuthors } from './insight-authors';
import { InsightLinks } from './insight-links';
import { InsightTags } from './insight-tags';
import { InsightTeam } from './insight-team';
import { PublishedDate } from './published-date';
import { TemplateSelection } from './template-selection';

const VALIDATE_INSIGHT_NAME = gql`
  query ValidateInsightName($name: String!, $namespace: String!) {
    validateInsightName(name: $name, namespace: $namespace) {
      isNameUnique
      isFullNameUnique
    }
  }
`;
interface Props {
  insight: any;
  isNewInsight: boolean;
  form: UseFormReturn<DraftForm>;
  templates: any;
  templateChange: (template: Pick<Insight, 'id' | 'fullName'>) => Promise<void>;
}

export const InsightMetadataEditor = ({ insight, isNewInsight, form, templates, templateChange }: Props) => {
  const {
    control,
    register,
    formState: { errors }
  } = form;

  const { isOpen: isAdvancedOpen, onToggle: onAdvancedToggle } = useDisclosure({ defaultIsOpen: false });

  const isCloned = insight.creation?.clonedFrom != null;

  const { name } = form.getValues();
  const namespace = insight.namespace;
  const [{ data: validateData }] = useQuery({
    query: VALIDATE_INSIGHT_NAME,
    variables: {
      name,
      namespace
    }
  });
  const isNameUnique = validateData?.validateInsightName?.isNameUnique;

  const itemTypeOptions = Object.values(ItemType).map((type) => {
    return { value: type, label: titleize(type), name: type };
  });

  const itemType = useWatch({
    control,
    name: 'itemType',
    defaultValue: insight?.itemType
  });

  useEffect(() => {
    register('metadata.publishedDate');
  }, [register]);

  return (
    <VStack spacing="1rem" p="1rem" align="stretch">
      {isNewInsight && isCloned && (
        <Alert
          mb="2rem"
          info={`This ${titleize(itemType)} has been cloned from ${
            insight.creation.clonedFrom
          }, and will create a new ${titleize(itemType)} when published.`}
        />
      )}

      {isNewInsight && !isCloned && (
        <TemplateSelection
          form={form}
          insight={insight}
          isNewInsight={isNewInsight}
          templates={templates}
          templateChange={templateChange}
        />
      )}

      <FormControl id="insight-item-type">
        <FormLabel>Item Type</FormLabel>
        <InputGroup>
          <Controller
            control={control}
            name="itemType"
            render={({ field: { onChange, value } }) => (
              <Select
                inputId="insight-item-type"
                options={itemTypeOptions}
                onChange={(e) => {
                  if (e) {
                    onChange(e.value);
                  }
                }}
                value={itemTypeOptions && value && itemTypeOptions.find((type) => type.name === value)}
                styles={{
                  menu: (base) => ({ ...base, zIndex: 11 }),
                  container: (base) => ({ ...base, width: '100%' }),
                  valueContainer: (base) => ({ ...base, paddingLeft: '10px' }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            )}
          />
        </InputGroup>
      </FormControl>

      <FormControl id="insight-name" isRequired isInvalid={errors.name !== undefined} mb="1rem">
        <FormLabel>{titleize(itemType)} Name</FormLabel>
        <InputGroup>
          <Input
            placeholder={`${titleize(itemType)} Name`}
            defaultValue={insight.name}
            errorBorderColor="red.300"
            {...register('name', { required: true, maxLength: 100 })}
          />
          {isNameUnique && name && (
            <InputRightElement children={<Icon as={iconFactory('check')} color="green.300" />} />
          )}
          {!isNameUnique && name && (
            <InputRightElement children={<Icon as={iconFactory('warning')} color="orange.300" />} />
          )}
        </InputGroup>
        {isNameUnique && name && (
          <FormHelperText color="green.300">Awesome name! Looks like nobody else is using it.</FormHelperText>
        )}
        {!isNameUnique && name && (
          <FormHelperText color="orange.300">
            Awesome name! But unfortunately someone has already used it.
          </FormHelperText>
        )}
        <FormErrorMessage>{formatFormError(errors.name)}</FormErrorMessage>
        <FormHelperText>A name that uniquely identifies this {titleize(itemType)}.</FormHelperText>
      </FormControl>

      <FormControl id="insight-description" isRequired isInvalid={errors.description !== undefined} mb="1rem">
        <FormLabel>Description</FormLabel>
        <Input
          placeholder={`${titleize(itemType)} Description`}
          defaultValue={insight.description}
          errorBorderColor="red.300"
          {...register('description', { required: true, maxLength: 256 })}
        />
        <FormErrorMessage>{formatFormError(errors.description)}</FormErrorMessage>
        <FormHelperText>
          Summarize the content of the {titleize(itemType)} to make it easier to discover.
        </FormHelperText>
      </FormControl>

      <InsightTags insight={insight} form={form} />

      <InsightTeam insight={insight} form={form} />

      {itemType === 'insight' && <PublishedDate insight={insight} form={form} />}

      <InsightLinks insight={insight} form={form} />

      <FormControl>
        <Flex display="flex" alignItems="center">
          <FormLabel htmlFor="unlisted-toggle" mb="0">
            Unlisted
          </FormLabel>
          <Controller
            control={control}
            name="isUnlisted"
            render={({ field: { onChange, value } }) => (
              <Switch id="unlisted-toggle" colorScheme="nord8" isChecked={value ?? false} onChange={onChange} />
            )}
          />
        </Flex>
        <FormHelperText>
          Unlisted {titleize(itemType)}s will not appear in search results, except for collaborators. Anyone with the
          link can view the {titleize(itemType)}.
        </FormHelperText>
      </FormControl>

      <Divider />

      <HStack justify="space-between" onClick={onAdvancedToggle}>
        <Heading fontSize="md" fontWeight="bold">
          Advanced
        </Heading>
        <IconButton
          aria-label="Expand/collapse"
          icon={isAdvancedOpen ? iconFactoryAs('chevronUp') : iconFactoryAs('chevronDown')}
          variant="ghost"
          size="sm"
          title={isAdvancedOpen ? 'Collapse this section' : 'Expand this section'}
        />
      </HStack>

      <Collapse in={isAdvancedOpen} animateOpacity>
        <VStack spacing="1rem" align="stretch">
          <HStack align="center">
            {iconFactoryAs('warning', { color: 'aurora.200' })}

            <Text fontSize="sm">These settings typically don't need to be changed.</Text>
          </HStack>

          <InsightAuthors insight={insight} form={form} />
        </VStack>
      </Collapse>
    </VStack>
  );
};
