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

import { Icon, Image } from '@chakra-ui/react';
import type { ReactElement } from 'react';
import type { IconType } from 'react-icons';
import {
  AiFillFolder,
  AiFillFolderOpen,
  AiOutlineBorderlessTable,
  AiOutlineFileText,
  AiOutlineFilePdf,
  AiFillPlayCircle
} from 'react-icons/ai';
import { BsImage } from 'react-icons/bs';
import { DiDatabase } from 'react-icons/di';
import { FaJava } from 'react-icons/fa';
import { GiHouseKeys, GiZipper } from 'react-icons/gi';
import {
  SiApachegroovy,
  SiClojure,
  SiGithub,
  SiGnubash,
  SiGo,
  SiHtml5,
  SiJavascript,
  SiJenkins,
  SiJson,
  SiJupyter,
  SiMicrosoftexcel,
  SiMicrosoftpowerpoint,
  SiMicrosoftword,
  SiPython,
  SiQuicktime,
  SiRstudio,
  SiRuby,
  SiScala,
  SiTypescript
} from 'react-icons/si';
import { VscCode, VscJson, VscMarkdown } from 'react-icons/vsc';

import { getMimeForFileName } from './mime-utils';

interface FileIcon {
  icon: IconType;
  color?: string;
}

const COLORS = {
  blue: '#519aba',
  green: '#8dc149',
  grey: '#4d5a5e',
  greyDark: '#1f2326',
  greyLight: '#6d8086',
  ignore: '#41535b',
  orange: '#e37933',
  pink: '#f55385',
  purple: '#a074c4',
  red: '#cc3e44',
  yellow: '#cbcb41'
};

const icons: Record<string, FileIcon> = {
  'application/javascript': {
    icon: SiJavascript,
    color: COLORS.yellow
  },
  'application/json': {
    icon: SiJson,
    color: COLORS.yellow
  },
  'application/pdf': {
    icon: AiOutlineFilePdf,
    color: COLORS.red
  },
  'application/unknown': {
    icon: AiOutlineFileText
  },
  'application/vnd.ms-excel': {
    icon: SiMicrosoftexcel,
    color: COLORS.green
  },
  'application/vnd.ms-powerpoint': {
    icon: SiMicrosoftpowerpoint,
    color: COLORS.purple
  },
  'application/msword': {
    icon: SiMicrosoftword,
    color: COLORS.blue
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    icon: SiMicrosoftpowerpoint,
    color: COLORS.purple
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    icon: SiMicrosoftexcel,
    color: COLORS.green
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    icon: SiMicrosoftword,
    color: COLORS.blue
  },
  'application/x-sh': {
    icon: SiGnubash,
    color: COLORS.grey
  },
  'application/x-sql': {
    icon: DiDatabase,
    color: COLORS.blue
  },
  'application/x-typescript': {
    icon: SiTypescript,
    color: COLORS.blue
  },
  'application/xml': {
    icon: VscCode,
    color: COLORS.orange
  },
  'application/zip': {
    icon: GiZipper,
    color: COLORS.greyLight
  },
  'image/gif': {
    icon: BsImage,
    color: COLORS.purple
  },
  'image/jpeg': {
    icon: BsImage,
    color: COLORS.purple
  },
  'image/png': {
    icon: BsImage,
    color: COLORS.purple
  },
  'image/svg+xml': {
    icon: BsImage,
    color: COLORS.purple
  },
  'text/csv': {
    icon: AiOutlineBorderlessTable,
    color: COLORS.green
  },
  'text/html': {
    icon: SiHtml5,
    color: COLORS.orange
  },
  'text/markdown': {
    icon: VscMarkdown,
    color: COLORS.blue
  },
  'text/plain': {
    icon: AiOutlineFileText,
    color: COLORS.greyLight
  },
  'text/x-clojure': {
    icon: SiClojure,
    color: COLORS.green
  },
  'text/x-go': {
    icon: SiGo,
    color: COLORS.blue
  },
  'text/x-groovy': {
    icon: SiApachegroovy,
    color: COLORS.green
  },
  'application/x-ipynb+json': {
    icon: SiJupyter,
    color: COLORS.blue
  },
  'text/x-java-source': {
    icon: FaJava,
    color: COLORS.red
  },
  'text/x-python': {
    icon: SiPython,
    color: COLORS.blue
  },
  'text/x-r': {
    icon: SiRstudio,
    color: COLORS.blue
  },
  'text/x-ruby': {
    icon: SiRuby,
    color: COLORS.red
  },
  'text/x-scala': {
    icon: SiScala,
    color: COLORS.red
  },
  'text/yaml': {
    icon: VscJson,
    color: COLORS.purple
  },
  'video/*': {
    icon: AiFillPlayCircle,
    color: COLORS.pink
  },
  'video/quicktime': {
    icon: SiQuicktime,
    color: COLORS.pink
  },

  // Unique file names
  jenkinsfile: {
    icon: SiJenkins,
    color: COLORS.red
  },
  license: {
    icon: GiHouseKeys,
    color: COLORS.yellow
  },
  '.gitignore': {
    icon: SiGithub,
    color: COLORS.ignore
  },

  // Special cases
  folder: {
    icon: AiFillFolder,
    color: 'frost.400'
  },
  folderOpen: {
    icon: AiFillFolderOpen,
    color: 'frost.400'
  }
};

export interface FileIconFactoryProps {
  mimeType?: string;
  fileName?: string;
  isFolder: boolean;
  isOpen: boolean;
  isSelected: boolean;
}

export const matchFileIcon = ({ mimeType, fileName, isFolder, isOpen, isSelected }: FileIconFactoryProps): FileIcon => {
  const effectiveMime = mimeType ?? getMimeForFileName(fileName ?? '', 'unknown');

  // Some file names have hardcoded icons
  if (fileName && icons[fileName.toLowerCase()]) {
    return icons[fileName.toLowerCase()];
  }

  if (isFolder) {
    return isOpen ? icons['folderOpen'] : icons['folder'];
  }

  // Try by MIME type
  if (icons[effectiveMime]) {
    return icons[effectiveMime];
  }

  // Try by MIME type group
  const group = effectiveMime.split('/')[0];
  const groupMatch = icons[`${group}/*`];

  if (groupMatch) {
    return groupMatch;
  }

  // Fallback!
  console.error(`[FILE_ICON_FACTORY] Missing icon for ${effectiveMime}!`);
  return icons['text/plain'];
};

export const fileIconFactoryAs = (factoryProps: FileIconFactoryProps, props = {}): ReactElement => {
  // Special case
  if (factoryProps.fileName === 'insight.yml') {
    return (
      <Image
        src="/assets/iex-logo.svg"
        display="inline-block"
        {...props}
        height={props['fontHeight'] ?? '1rem'}
        alt="IEX Logo"
      />
    );
  }

  const fileIcon = matchFileIcon(factoryProps);
  const internalProps = {
    color: fileIcon.color ?? 'frost.400'
  };

  return <Icon as={fileIcon.icon} {...internalProps} {...props} />;
};
