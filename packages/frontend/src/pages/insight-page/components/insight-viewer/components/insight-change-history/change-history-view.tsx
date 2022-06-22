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

import { Box, Flex, Heading, HStack, Icon, Text, Tooltip, Stack, VStack, Button } from '@chakra-ui/react';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import { ExternalLink } from '../../../../../../components/external-link/external-link';
import { TextWithIcon } from '../../../../../../components/text-with-icon/text-with-icon';
import { UserTag } from '../../../../../../components/user-tag/user-tag';
import type { Insight, InsightChange, InsightChangeEdge } from '../../../../../../models/generated/graphql';
import { formatDateIntl, formatRelativeIntl } from '../../../../../../shared/date-utils';
import { iconFactory } from '../../../../../../shared/icon-factory';
import type { RootState } from '../../../../../../store/store';

export interface ChangeHistoryProps {
  changeEdge: InsightChangeEdge;
  insightFullName: string;
  enableRollBack: boolean;
  onRollBackChange: Promise<Insight>;
  fetchingRollBack: boolean;
}
export const ChangeHistoryView = ({
  changeEdge,
  insightFullName,
  enableRollBack,
  onRollBackChange,
  fetchingRollBack,
  ...props
}) => {
  const change: InsightChange = changeEdge.node;

  const { appSettings } = useSelector((state: RootState) => state.app);

  const [clicked, setClicked] = useState(false);

  const onClick = async () => {
    setClicked(true);
    await onRollBackChange(change.oid);
    setClicked(false);
  };

  return (
    <Stack {...props}>
      <HStack align="flex-start">
        <Box h="full" alignContent="center">
          <Icon as={iconFactory('pullRequest')} />
        </Box>
        <VStack margin="1px" align="stretch" flexGrow={1}>
          <Heading fontSize="xl">{change.message}</Heading>
          <HStack pl="0.5rem" margin="1px">
            <UserTag user={change.author} />
            <Text>committed</Text>
            <Tooltip label={formatDateIntl(change.committedDate, DateTime.DATETIME_MED)} placement="right">
              <Text>{formatRelativeIntl(change.committedDate)}</Text>
            </Tooltip>
          </HStack>
        </VStack>
        <HStack alignContent="center" h="full">
          <Button size="sm" onClick={onClick} disabled={!enableRollBack || fetchingRollBack} isLoading={clicked}>
            Roll back to commit
          </Button>
        </HStack>
      </HStack>

      <Flex direction="column">
        <Stack
          direction={{ base: 'column', xl: 'row' }}
          spacing={{ xl: '1.5rem' }}
          flexGrow={1}
          align="flex-start"
          m="0.5rem"
          ml="2rem"
        >
          <TextWithIcon iconName="fileChange" iconColor="fff">
            {`${change.changedFiles} Files Changed`}
          </TextWithIcon>
          <TextWithIcon iconName="additions" iconColor="fff">
            {`${change.additions} Additions`}
          </TextWithIcon>
          <TextWithIcon iconName="deletions" iconColor="fff">
            {`${change.deletions} Deletions`}
          </TextWithIcon>
          <HStack>
            <TextWithIcon iconName="commit" iconColor="fff">
              Commit Hash:{' '}
            </TextWithIcon>
            <ExternalLink
              href={`${appSettings?.gitHubSettings.url}/${insightFullName}/commit/${change.oid}`}
              display="inline-block"
            >
              <Text as="span" fontWeight="bold">
                {change.abbreviatedOid}
              </Text>
            </ExternalLink>
          </HStack>
        </Stack>
      </Flex>
    </Stack>
  );
};
