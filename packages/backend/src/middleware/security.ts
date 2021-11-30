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

import helmet from 'helmet';

/**
 * Middleware wrapping Helmet with some configuration
 */
export const security = helmet({
  contentSecurityPolicy: {
    reportOnly: false,
    directives: {
      'default-src': ["'self'"],
      'base-uri': ["'self'"],
      'upgrade-insecure-requests': [],

      // Requires HTTPS connections for everything
      'block-all-mixed-content': [],

      'connect-src': [
        "'self'",
        // Allow GA to connect
        'https://*.google-analytics.com',
        'https://raw.githubusercontent.com',
        process.env.OKTA_BASE_URL!,
        '*'
      ],
      'font-src': ["'self'", 'https:', 'data:'],

      // Allow embedding in any sites; may need to revisit
      'frame-ancestors': ["'self'", '*'],

      'frame-src': ["'self'", process.env.OKTA_BASE_URL!, '*'],

      // Allowing images/objects from all sources, since an Insight might
      // embed an image from an external URL
      'img-src': ["'self'", 'data:', '*'],
      'media-src': ["'self'", '*'],
      'object-src': ["'self'", '*'],

      // Unsafe-inline and unsafe-eval are required by React/webpack or something
      // cdn.jsdelivr.net is used by GraphQL Playground
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://*.google-analytics.com',
        'https://cdn.jsdelivr.net',
        '*'
      ],
      'script-src-attr': ["'none'"],

      'style-src': ["'self'", 'https:', "'unsafe-inline'"]
    }
  },
  frameguard: false
});
