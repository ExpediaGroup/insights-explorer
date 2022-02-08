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

import { Box, Button, Heading, HStack, Icon, Tag, TagLabel, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { ReactChild } from 'react';
import { Helmet } from 'react-helmet';

import { Card } from '../../components/card/card';
import { Link } from '../../components/link/link';
import { iconFactory } from '../../shared/icon-factory';

interface Props {
  icon?: any;
  errorCode?: string;
  heading?: string;
  message?: string | string[] | ReactChild[] | JSX.Element;
}

const defaultProps: Required<Props> = {
  icon: iconFactory('404'),
  errorCode: '404 Page Not Found',
  heading: `Don't Panic!`,
  message: `We looked all over but couldn't find this page.`
};

export const ErrorPage = (props: Props) => {
  const mergedProps = { ...defaultProps, ...props };

  return (
    <>
      <Helmet>
        <title>{mergedProps.errorCode}</title>
      </Helmet>

      <VStack as={Card} align="center" p="3rem">
        <Wrap spacing="2rem" align="center" p="2.5rem">
          <WrapItem>
            <Icon as={mergedProps.icon} fontSize="12rem" color="polar.200" />
          </WrapItem>
          <WrapItem>
            <VStack spacing="1rem" align="flex-start" maxWidth="36rem">
              <Tag rounded="full" size="lg" bg="aurora.200" color="polar.100" fontWeight="bold">
                <TagLabel>{mergedProps.errorCode}</TagLabel>
              </Tag>
              <Heading color="polar.200" fontSize="4rem">
                {mergedProps.heading}
              </Heading>
              <Text fontSize="1.4rem">{mergedProps.message}</Text>

              <HStack>
                <Button variant="frost" onClick={() => window.history.go(-1)}>
                  Back
                </Button>
                <Button variant="frost" to="/" as={Link} underline={false}>
                  Home Page
                </Button>
              </HStack>

              <Box pt="2rem">
                <Link to="/help" color="frost.400">
                  Visit our Help Center
                </Link>
              </Box>
            </VStack>
          </WrapItem>
        </Wrap>
      </VStack>
    </>
  );
};
