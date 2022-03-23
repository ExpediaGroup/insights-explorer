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

import type { BoxProps } from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  useClipboard,
  useDisclosure
} from '@chakra-ui/react';

import { IconButtonMenu } from '../../../../../../components/icon-button-menu/icon-button-menu';
import { IexMenuItem } from '../../../../../../components/iex-menu-item/iex-menu-item';
import { CodeRenderer } from '../../../../../../components/renderers/code-renderer/code-renderer';
import type { Insight } from '../../../../../../models/generated/graphql';
import { iconFactory } from '../../../../../../shared/icon-factory';

const EmbedModal = ({ insight }: { insight: Insight }) => {
  // Disclosure for showing the embed modal
  const { isOpen, onOpen, onClose } = useDisclosure();

  const embedCode = `<iframe
  src="${window.location.href}?export"
  style="width: 100%; height: 90vh;">
</iframe>`;

  return (
    <>
      <IexMenuItem icon={iconFactory('code')} onClick={onOpen}>
        Embed
      </IexMenuItem>

      <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Embed this Insight</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Use the following HTML to embed this Insight in another web site:</Text>
            <CodeRenderer contents={embedCode} copyButton={true} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export const ShareMenu = ({
  insight,
  fontSize = '1.5rem',
  size = 'lg',
  ...props
}: { insight: Insight; fontSize?: string; size?: string } & BoxProps) => {
  const { hasCopied, onCopy } = useClipboard(insight.url);

  return (
    <IconButtonMenu
      aria-label="Share menu"
      icon={iconFactory(hasCopied ? 'check' : 'share')}
      fontSize={fontSize}
      size={size}
      tooltip="Share"
      variant="solid"
    >
      <IexMenuItem icon={iconFactory('clipboard')} onClick={onCopy}>
        Copy Link
      </IexMenuItem>

      <IexMenuItem icon={iconFactory('print')} to="?export&print">
        Print
      </IexMenuItem>

      <EmbedModal insight={insight} />
    </IconButtonMenu>
  );
};
