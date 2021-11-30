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

import { Button, Spinner, VStack } from '@chakra-ui/react';
import { useState } from 'react';

import { Alert } from '../../../../components/alert/alert';
import { useNews } from '../../../../shared/useNews';

import { EditNewsItem } from './components/edit-news-item/edit-news-item';
import { NewsItem } from './components/news-item/news-item';

export const NewsAdmin = () => {
  const {
    data,
    error,
    fetching,
    onAddNews,
    addNewsError,
    addNewsFetching,
    deleteNewsError,
    deleteNewsFetching,
    onDeleteNews,
    onUpdateNews,
    updateNewsError,
    updateNewsFetching
  } = useNews({ active: false });

  const [adding, setAdding] = useState(false);

  const newsEdges = data?.news.edges ?? [];

  return (
    <VStack p="1rem">
      {fetching && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />}
      {error && <Alert error={error} />}
      {addNewsError && <Alert error={addNewsError} />}
      {updateNewsError && <Alert error={updateNewsError} />}
      {deleteNewsError && <Alert error={deleteNewsError} />}

      {!fetching && (
        <VStack align="stretch">
          {adding ? (
            <EditNewsItem
              isNew={true}
              isSubmitting={addNewsFetching}
              onCancel={() => setAdding(false)}
              onSubmit={(update) => onAddNews({ news: update }).then(() => setAdding(false))}
            />
          ) : (
            <Button variant="solid" bg="frost.300" onClick={() => setAdding(true)}>
              Add News
            </Button>
          )}

          {newsEdges.map((edge) => (
            <NewsItem
              key={edge.node.id}
              edge={edge}
              isSubmitting={updateNewsFetching || deleteNewsFetching}
              onDelete={(news) => onDeleteNews({ newsId: edge.node.id })}
              onSubmit={(update) => onUpdateNews({ newsId: edge.node.id, news: update })}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
};
