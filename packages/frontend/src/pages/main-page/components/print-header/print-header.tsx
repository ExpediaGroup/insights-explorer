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

import { Button, Flex, Heading, HStack, Icon } from '@chakra-ui/react';

import { Link } from '../../../../components/link/link';
import { iconFactory, iconFactoryAs } from '../../../../shared/icon-factory';

import './print-header.css';

export const PrintHeader = () => {
  const onPrint = () => {
    window.print();
    return false;
  };

  return (
    <Flex flexDirection="row" width="100%" bg="polar.600" py="0.5rem" px="2rem" align="center" id="print-header">
      <Heading size="xs" flexGrow={2} color="snowstorm.300">
        <Link to={window.location.pathname} display="flex">
          <Icon as={iconFactory('arrowLeft')} mr="0.5rem" color="snowstorm.300" />
          Return to Insight
        </Link>
      </Heading>
      <HStack spacking="1rem">
        <Button size="sm" onClick={onPrint} rightIcon={iconFactoryAs('print')}>
          Print
        </Button>

        <Link to={window.location.pathname + '?export'}>
          <Button aria-label="Close" size="sm" rightIcon={iconFactoryAs('close')}>
            Hide Header
          </Button>
        </Link>
      </HStack>
    </Flex>
  );
};
