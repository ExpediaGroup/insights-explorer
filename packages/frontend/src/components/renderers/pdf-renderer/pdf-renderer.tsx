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

import { Box } from '@chakra-ui/react';

export const PdfRenderer = ({ url }) => (
  <Box minH="100vh" height="100%">
    <object data={url} type="application/pdf" width="100%" height="100%" style={{ height: '100vh' }}>
      <p>
        This PDF cannot be shown in the browser. It is available for download <a href={url}>here</a>.
      </p>
    </object>
  </Box>
);
