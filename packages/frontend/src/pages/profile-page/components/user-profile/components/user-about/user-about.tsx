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

import { HStack, Stat, StatLabel, StatNumber, Text, VStack } from '@chakra-ui/react';

import { Card } from '../../../../../../components/card/card';
import { MarkdownContainer } from '../../../../../../components/markdown-container/markdown-container';
import { User } from '../../../../../../models/generated/graphql';

interface Props {
  user: User;
}

export const UserAbout = ({ user }: Props) => {
  return (
    <HStack align="flex-start">
      <Card mt="1rem" p="1rem" flexGrow={2}>
        {user.readme && <MarkdownContainer contents={user.readme} />}
        {!user.readme && <Text>Apparently, this user prefers to keep an air of mystery about them.</Text>}
      </Card>
      <VStack
        spacing="1rem"
        align="flex-start"
        flexBasis={{ base: '10rem', xl: '12rem' }}
        flexShrink={0}
        maxWidth={{ base: '10rem', xl: '12rem' }}
        mr="1rem"
        p="1rem"
      >
        <Stat>
          <StatLabel>Insights Authored</StatLabel>
          <StatNumber fontSize="4xl">{user.authoredInsights?.pageInfo?.total}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Insights Liked</StatLabel>
          <StatNumber fontSize="4xl">{user.likedInsights?.pageInfo?.total}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Comments</StatLabel>
          <StatNumber fontSize="4xl">{user.commentCount}</StatNumber>
        </Stat>
      </VStack>
    </HStack>
  );
};
