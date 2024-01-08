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

import { useState, useEffect } from 'react';

interface Props {
  url: string;
  contents?: string | undefined;
  method?: 'GET' | 'HEAD';
  paused?: boolean;
}

/**
 * React Hook to fetch data from a URL.  If `contents`
 * is provided, it will be returned directly instead
 * of fetching from the URL.
 *
 * Note: this hook currently returns TEXT only.
 *
 * @param url URL to fetch
 * @param contents Optional pre-fetched data
 */
export const useFetch = ({ url, contents, method = 'GET', paused = false }: Props) => {
  const [fetching, setFetching] = useState(false);
  const [data, setData] = useState<string | undefined>(contents);
  const [error, setError] = useState<any>(undefined);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    // Skip when paused
    if (paused) {
      return;
    }

    // Already pre-fetched?  Let's use it!
    if (contents != null) {
      return;
    }

    // No pre-fetched data means url is required
    if (!url) return;

    const fetchData = async () => {
      setFetching(true);

      try {
        const response = await fetch(url, { method, signal });
        const data = await response.text();

        if (response.ok) {
          setData(data);
          setError(undefined);
        } else {
          setError(response.statusText);
          setData(undefined);
        }
        setFetching(false);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error(error);
      }
    };

    fetchData();

    return function cleanup() {
      abortController.abort();
    };
  }, [contents, method, paused, url]);

  return { fetching, data, error };
};
