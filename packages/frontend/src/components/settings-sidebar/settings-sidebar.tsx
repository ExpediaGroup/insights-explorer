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

import { Heading, VStack } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';

import { Link } from '../link/link';

export interface SettingsSection {
  label: string;
  path: string;
}

interface Props {
  bottomContent?: ReactElement;
  sections: SettingsSection[];
  title?: string;
}

const Section = ({ section }: { section: SettingsSection }) => {
  const location = useLocation();
  const isCurrent = location.pathname === section.path;

  return (
    <Link to={section.path}>
      <Heading as="h3" size="sm" fontWeight={isCurrent ? 'bold' : 'normal'}>
        {section.label}
      </Heading>
    </Link>
  );
};

export const SettingsSidebar = ({ bottomContent, sections, title = 'Settings' }: Props) => {
  return (
    <VStack
      spacing="1rem"
      flexBasis={{ base: '8rem', md: '16rem' }}
      flexShrink={0}
      maxWidth={{ base: '100%', md: '16rem' }}
      p="1rem"
      alignItems="start"
    >
      <Heading mb="1rem">{title}</Heading>

      {sections.map((section) => (
        <Section key={section.label} section={section} />
      ))}

      {bottomContent}
    </VStack>
  );
};
