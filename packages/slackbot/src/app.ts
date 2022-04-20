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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { getLogger } from '@iex/shared/logger';
import type { LinkUnfurls } from '@slack/bolt';
import { App, LogLevel } from '@slack/bolt';

import { getUnfurl } from './lib/unfurls';

const logger = getLogger('app');

const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  developerMode: process.env.SLACK_DEVELOPER_MODE === 'true',
  socketMode: true,
  convoStore: false,
  logLevel: LogLevel.DEBUG
});

/* Add functionality here */
app.event('link_shared', async ({ event, context, client, say }) => {
  logger.info(`Link shared!`);
  // eslint-disable-next-line no-console
  //console.log('event', event);
  // eslint-disable-next-line no-console
  //console.log('context', context);

  const tuples = await Promise.all(event.links.map(async (link) => ({ link, unfurl: await getUnfurl(link) })));

  const unfurls = tuples
    .filter(({ unfurl }) => unfurl !== undefined)
    .reduce<LinkUnfurls>((accumulator, { link, unfurl }) => {
      accumulator[link.url] = unfurl!;
      return accumulator;
    }, {});

  if (Object.keys(unfurls).length > 0) {
    client.chat.unfurl({
      ts: event.message_ts,
      channel: event.channel,
      unfurls
    });
  }
});

export const startApp = async (): Promise<void> => {
  const port = Number(process.env.PORT || 3000);

  // Start the app
  await app.start(port);

  logger.info('⚡️ IEX Slack App is running!');
};
