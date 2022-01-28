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

import { Flex, Image } from '@chakra-ui/react';
import Zoom from 'react-medium-image-zoom';

import 'react-medium-image-zoom/dist/styles.css';

export const ImageRenderer = ({ url }) => {
  return (
    <Zoom>
      <Flex direction="column" flexGrow={1} overflow="hidden" alignItems="center" justifyContent="center" margin="2rem">
        <Image src={url} objectFit="contain" />
      </Flex>
    </Zoom>
  );
};
