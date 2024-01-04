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

import { Icon } from '@chakra-ui/react';
import type { ReactElement } from 'react';
import type { IconType } from 'react-icons';
import {
  AiFillEdit,
  AiFillGift,
  AiOutlineFieldTime,
  AiOutlineFileAdd,
  AiOutlineLink,
  AiOutlineLogin,
  AiOutlineMenu,
  AiOutlineProfile,
  AiOutlineSwap,
  AiOutlineTags
} from 'react-icons/ai';
import { BsFillQuestionCircleFill, BsShieldLock, BsShieldLockFill, BsThreeDotsVertical } from 'react-icons/bs';
import {
  FaArrowCircleLeft,
  FaFilter,
  FaHeart,
  FaHeartBroken,
  FaMoon,
  FaRegHeart,
  FaSlack,
  FaSortAmountDownAlt,
  FaSortAmountUpAlt,
  FaSun,
  FaUserCircle,
  FaUserEdit,
  FaUsers,
  FaUserTimes
} from 'react-icons/fa';
import {
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiFileMinus,
  FiFilePlus,
  FiFileText
} from 'react-icons/fi';
import {
  GoCheck,
  GoChevronDown,
  GoChevronLeft,
  GoChevronRight,
  GoChevronUp,
  GoCircleSlash,
  GoCommentDiscussion,
  GoGitCommit,
  GoLinkExternal,
  GoLocation,
  GoReply,
  GoRss,
  GoSearch,
  GoSync,
  GoX
} from 'react-icons/go';
import {
  GrCircleInformation,
  GrClone,
  GrDocumentLocked,
  GrDocumentMissing,
  GrDocumentTest,
  GrDocumentText,
  GrGraphQl,
  GrOverview,
  GrStatusUnknown,
  GrTemplate,
  GrUndo
} from 'react-icons/gr';
import {
  MdAdd,
  MdContentCopy,
  MdFileDownload,
  MdOndemandVideo,
  MdPrint,
  MdSchedule,
  MdShare,
  MdUpdate
} from 'react-icons/md';
import { RiVipCrownLine } from 'react-icons/ri';
import { SiGithub } from 'react-icons/si';
import {
  VscBriefcase,
  VscCalendar,
  VscChevronLeft,
  VscChevronRight,
  VscCircuitBoard,
  VscCloudUpload,
  VscCode,
  VscDebugDisconnect,
  VscError,
  VscFeedback,
  VscFolderOpened,
  VscGitPullRequest,
  VscJson,
  VscListTree,
  VscMail,
  VscMarkdown,
  VscNewFile,
  VscNewFolder,
  VscPreview,
  VscRocket,
  VscSettingsGear,
  VscTrash,
  VscWarning
} from 'react-icons/vsc';

const icons = {
  404: VscDebugDisconnect,
  activities: FiActivity,
  additions: FiFilePlus,
  admin: BsShieldLock,
  arrowLeft: FaArrowCircleLeft,
  authenticationError: VscError,
  biography: VscFeedback,
  briefcase: VscBriefcase,
  cancel: GoCircleSlash,
  calendar: VscCalendar,
  check: GoCheck,
  chevronDown: GoChevronDown,
  chevronLeft: GoChevronLeft,
  chevronRight: GoChevronRight,
  chevronUp: GoChevronUp,
  clone: GrClone,
  close: GoX,
  clipboard: MdContentCopy,
  code: VscCode,
  comments: GoCommentDiscussion,
  commit: GoGitCommit,
  converted: AiOutlineSwap,
  createDate: MdSchedule,
  crown: RiVipCrownLine,
  deletions: FiFileMinus,
  download: MdFileDownload,
  draft: AiFillEdit,
  edit: AiFillEdit,
  email: VscMail,
  fileChange: FiFileText,
  filter: FaFilter,
  folderOpened: VscFolderOpened,
  github: SiGithub,
  graphql: GrGraphQl,
  heart: FaRegHeart,
  heartFilled: FaHeart,
  help: BsFillQuestionCircleFill,
  info: GrCircleInformation,
  insight: GrDocumentTest,
  insightMissing: GrDocumentMissing,
  integration: VscCircuitBoard,
  json: VscJson,
  link: AiOutlineLink,
  linkExternal: GoLinkExternal,
  listTree: VscListTree,
  location: GoLocation,
  login: AiOutlineLogin,
  markdown: VscMarkdown,
  moon: FaMoon,
  menu: AiOutlineMenu,
  new: MdAdd,
  newFile: VscNewFile,
  newFolder: VscNewFolder,
  newInsight: AiOutlineFileAdd,
  nextPage: VscChevronRight,
  optionsMenu: BsThreeDotsVertical,
  news: AiFillGift,
  page: GrDocumentText,
  paginateLeft: FiChevronLeft,
  paginateRight: FiChevronRight,
  paginateFirst: FiChevronsLeft,
  paginateLast: FiChevronsRight,
  permissions: FaUserEdit,
  preview: VscPreview,
  previousPage: VscChevronLeft,
  print: MdPrint,
  profile: AiOutlineProfile,
  pullRequest: VscGitPullRequest,
  readonly: GrDocumentLocked,
  reply: GoReply,
  rocket: VscRocket,
  rss: GoRss,
  search: GoSearch,
  secure: BsShieldLockFill,
  settings: VscSettingsGear,
  share: MdShare,
  slack: FaSlack,
  sortDown: FaSortAmountDownAlt,
  sortUp: FaSortAmountUpAlt,
  sun: FaSun,
  sync: GoSync,
  tags: AiOutlineTags,
  team: FaUsers,
  template: GrTemplate,
  time: AiOutlineFieldTime,
  trash: VscTrash,
  unlike: FaHeartBroken,
  video: MdOndemandVideo,
  views: GrOverview,
  undo: GrUndo,
  unknown: GrStatusUnknown,
  updateDate: MdUpdate,
  upload: VscCloudUpload,
  user: FaUserCircle,
  userMissing: FaUserTimes,
  warning: VscWarning
};

export const iconFactory = (key: string): IconType => {
  if (icons[key]) {
    return icons[key];
  }

  // Fallback!
  console.error(`[ICON_FACTORY] Missing icon for ${key}!`);
  return GrStatusUnknown;
};

export const iconFactoryAs = (key: string, props = {}): ReactElement => {
  return <Icon as={iconFactory(key)} {...props} sx={{ path: { stroke: 'unset' } }} />;
};
