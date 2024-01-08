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

import type { AlertStatus, As, BoxProps } from '@chakra-ui/react';
import { Alert as ChakraAlert, AlertIcon, Flex, Text } from '@chakra-ui/react';
import startCase from 'lodash/startCase';
import type { ReactNode } from 'react';

import { iconFactory } from '../../shared/icon-factory';

type StringOrMessage = string | { message: string };
type Status = 'error' | 'success' | 'warning' | 'info' | 'secure';

interface Props {
  children?: ReactNode | ReactNode[] | string | string[];
  status?: Status;
  message?: StringOrMessage;
  error?: StringOrMessage;
  warning?: StringOrMessage;
  info?: StringOrMessage;
  success?: StringOrMessage;
  icon?: As;
}

function getMessage(i: StringOrMessage): string {
  return typeof i === 'string' ? i : i.message;
}

export const Alert = ({
  children,
  status,
  message,
  error,
  warning,
  info,
  success,
  icon,
  ...props
}: Props & Omit<BoxProps, 'children'>) => {
  let derivedMessage = message;
  let derivedStatus: AlertStatus;

  if (status === 'secure') {
    icon = iconFactory('secure');
    derivedStatus = 'info';
  } else if (status == null) {
    // Auto-detect status from which variable was used
    if (error != null) {
      derivedMessage = getMessage(error);
      derivedStatus = 'error';
    } else if (warning != null) {
      derivedMessage = getMessage(warning);
      derivedStatus = 'warning';
    } else if (info != null) {
      derivedMessage = getMessage(info);
      derivedStatus = 'info';
    } else if (success == null) {
      derivedStatus = 'error';
    } else {
      derivedMessage = getMessage(success);
      derivedStatus = 'success';
    }
  } else {
    derivedStatus = status;
  }

  return (
    <ChakraAlert status={derivedStatus} borderRadius="0.25rem" {...props}>
      {icon && <AlertIcon as={icon} flexShrink={0} />}
      {icon === undefined && <AlertIcon flexShrink={0} />}

      <Flex wordBreak="break-word" flexGrow={2} align="center" fontSize={{ base: 'sm', md: 'md' }}>
        <Text as="strong" mr="0.5rem" flexShrink={0}>
          {startCase(derivedStatus)}:{' '}
        </Text>
        {children === undefined ? (derivedMessage as string) : children}
      </Flex>
    </ChakraAlert>
  );
};
