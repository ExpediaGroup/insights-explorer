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

import { Skeleton, Wrap } from '@chakra-ui/react';

export const InsightListSkeleton = ({ count = 3, options }) => {
  // Special handling for Square
  if (options.layout === 'square') {
    return (
      <Wrap
        spacing="1rem"
        direction={{ base: 'column', sm: 'row' }}
        sx={{
          '> ul': {
            flexWrap: { base: 'nowrap', sm: 'wrap' }
          }
        }}
      >
        {Array.from({ length: count * 2 })
          .fill(1)
          .map((value, index) => (
            <Skeleton
              key={`search-results-skeleton-${index}`}
              sx={{ aspectRatio: '1' }}
              width={{ base: 'unset', sm: '16rem', md: '17rem', lg: '18rem', '2xl': '20rem' }}
            />
          ))}
      </Wrap>
    );
  }

  let layoutProps = {};
  switch (options.layout) {
    case 'square': {
      layoutProps = {
        height: { base: '16rem', md: '17rem', lg: '18rem', '2xl': '20rem' },
        width: { base: '16rem', md: '17rem', lg: '18rem', '2xl': '20rem' },
        float: 'left',
        marginRight: '1rem'
      };
      break;
    }
    case 'compact': {
      layoutProps = {
        height: '3.1rem'
      };
      break;
    }
    case 'default':
    default: {
      layoutProps = {
        height: '7rem'
      };
    }
  }

  return (
    <>
      {Array.from({ length: count })
        .fill(1)
        .map((value, index) => (
          <Skeleton key={`search-results-skeleton-${index}`} mb="1rem" {...layoutProps} />
        ))}
    </>
  );
};
