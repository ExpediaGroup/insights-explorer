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

import { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Hook to scroll to an asynchronously-loaded anchor element.
 *
 * It uses the location hash directly (if set).
 *
 * This is required for dynamic content e.g. rendered Markdown
 *
 */
export const useScrollToLocation = () => {
  // Get hash from URL (if any)
  const { hash } = useLocation();

  // Track whether or not we've already scrolled to the location
  const scrolledRef = useRef(false);

  // Track when the hash changes
  const hashRef = useRef(hash);

  useEffect(() => {
    if (hash) {
      // Reset if hash changes
      if (hashRef.current !== hash) {
        hashRef.current = hash;
        scrolledRef.current = false;
      }

      // Ensure we haven't already scrolled
      if (!scrolledRef.current) {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          scrolledRef.current = true;
        }
      }
    }
  });
};
