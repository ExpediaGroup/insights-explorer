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

import {
  DrawerBody,
  DrawerHeader,
  DrawerContent,
  DrawerCloseButton,
  Spinner,
  useColorModeValue,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import type { News } from '../../../../../../../../models/generated/graphql';
import { useLikedBy } from '../../../../../../../../shared/useLikedBy';
import { useNews } from '../../../../../../../../shared/useNews';
import { appSlice } from '../../../../../../../../store/app.slice';
import { NewsItem } from '../news-item/news-item';

export const NewsDrawerContents = () => {
  const backgroundColor = useColorModeValue('nord.100', 'polar.100');

  const toast = useToast();
  const dispatch = useDispatch();

  const { data, fetching, onLikeNews } = useNews({ active: true });
  const { onFetchLikedBy } = useLikedBy('news');

  const onLike = async (newsId: string, liked: boolean): Promise<boolean> => {
    const { error } = await onLikeNews({
      newsId,
      liked
    });

    if (error) {
      toast({
        position: 'bottom-right',
        title: 'Unable to like news.',
        status: 'error',
        duration: 9000,
        isClosable: true
      });
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (data) {
      const edges = data.news.edges;
      if (edges.length > 0) {
        dispatch(appSlice.actions.mostRecentNews(edges[0].node.activeAt));
      }
    }
  }, [data, dispatch]);

  return (
    <DrawerContent>
      <DrawerHeader bg={backgroundColor}>What's New</DrawerHeader>
      <DrawerCloseButton />
      <DrawerBody bg={backgroundColor}>
        <VStack spacing="0.5rem" align="stretch">
          {fetching && (
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
              alignSelf="center"
              mt="2rem"
            />
          )}
          {data?.news.edges.map((edge) => (
            <NewsItem key={edge.node.id} news={edge.node as News} onLike={onLike} onFetchLikedBy={onFetchLikedBy} />
          ))}
        </VStack>
      </DrawerBody>
    </DrawerContent>
  );
};
