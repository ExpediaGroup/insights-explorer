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
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  FormControl,
  FormLabel,
  useDisclosure
} from '@chakra-ui/react';
import { RefObject, useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import { UseFormReturn } from 'react-hook-form';
import Select from 'react-select';
import titleize from 'titleize';

import { Insight } from '../../../../models/generated/graphql';

interface Props {
  insight: any;
  isNewInsight: boolean;
  form: UseFormReturn<any>;
  templates: any;
  templateChange: (template: Pick<Insight, 'id' | 'fullName'>) => Promise<void>;
}

export const TemplateSelection = ({ insight, isNewInsight, form, templates, templateChange }: Props) => {
  // Template alert confirmation
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as RefObject<HTMLButtonElement>;

  const pendingTemplate = useRef<Insight>();

  const {
    control,
    register,
    formState: { errors }
  } = form;

  useEffect(() => {
    register('creation.template');
  }, [register]);

  const selectedTemplate = useWatch({
    control,
    name: 'creation.template',
    defaultValue: insight.creation?.template
  });

  const itemType = useWatch({
    control,
    name: 'itemType',
    defaultValue: insight?.itemType
  });

  const templateOptions = templates.map((template) => {
    return { value: template.id, label: template.name, name: template.fullName };
  });

  const onChange = (event) => {
    pendingTemplate.current = templates.find((template) => template.id === event.value);
    onOpen();
  };

  const onApprove = () => {
    if (pendingTemplate.current) {
      templateChange(pendingTemplate.current);
    }
    onClose();
  };

  const onReject = () => {
    onClose();
  };

  return (
    <>
      <FormControl id="insight-template" isInvalid={errors.creation?.template !== undefined} mb="1rem">
        <FormLabel>{titleize(itemType)} Template</FormLabel>
        <Select
          inputId="insight-template"
          name="creation.template"
          options={templateOptions}
          value={templateOptions && templateOptions.find((option) => option.name === selectedTemplate)}
          onChange={onChange}
        />
      </FormControl>

      <AlertDialog leastDestructiveRef={cancelRef} onClose={onClose} isOpen={isOpen}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Change Template?</AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              Changing the template will overwrite <strong>all</strong> current changes, if any. You may lose work. Are
              you sure you want to proceed?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onReject}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={onApprove} ml={3}>
                Change Template
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};
