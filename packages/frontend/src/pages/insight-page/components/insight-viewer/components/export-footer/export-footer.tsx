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

import { Box, BoxProps, Stack, Tag, TagLabel, useColorModeValue } from '@chakra-ui/react';

import { Card } from '../../../../../../components/card/card';
import { Link } from '../../../../../../components/link/link';
import { SidebarHeading } from '../../../../../../components/sidebar-heading/sidebar-heading';
import { Insight } from '../../../../../../models/generated/graphql';

export const ExportFooter = ({ insight, ...props }: { insight: Insight } & BoxProps) => {
  const fileBgColor = useColorModeValue('snowstorm.300', 'gray.700');

  if (insight == null) {
    return <Box></Box>;
  }

  return (
    <>
      {insight.files && insight.files.length > 0 && (
        <Box as={Card} spacing="1rem" p="1rem" align="stretch" {...props} mb="1rem">
          <SidebarHeading>Files</SidebarHeading>
          <Stack spacing="0.25rem">
            {insight.files.map((file) => {
              return (
                <Link to={`/${insight.itemType}/${insight.fullName}/files/${file.path}?export`} key={file.id}>
                  <Tag bg={fileBgColor} rounded="full">
                    <TagLabel>{file.path}</TagLabel>
                  </Tag>
                </Link>
              );
            })}
          </Stack>
        </Box>
      )}
    </>
  );
};
