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

import { Icon, Text, VStack } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';
import { IoConstruct } from 'react-icons/io5';

import { Card } from '../../../../components/card/card';
import { Crumbs } from '../../../../components/crumbs/crumbs';
import { IexHeading } from '../../../../components/iex-heading/iex-heading';

export const GettingStartedPage = () => {
  return (
    <>
      <Helmet>
        <title>Getting Started | Help</title>
      </Helmet>

      <VStack align="stretch" mt="2rem">
        <Crumbs
          crumbs={[
            { text: 'Help', link: `/help` },
            { text: 'Getting Started', link: '#' }
          ]}
        />

        <VStack as={Card} flexDirection="column" spacing="1rem" p="1rem" align="flex-start">
          <IexHeading level={1} id="getting-started">
            Getting Started
          </IexHeading>

          <Icon as={IoConstruct} fontSize="3rem" />
          <Text>Under construction</Text>
        </VStack>
      </VStack>
    </>
  );
};
