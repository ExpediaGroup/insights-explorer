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

import { useToast } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { appSlice } from '../../../../store/app.slice';
import type { AppDispatch, RootState } from '../../../../store/store';

export const GlobalErrors = () => {
  const { globalErrorMessages } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  // Whenever global error messages are added, this component
  // creates a toast to display them, then removes them so they
  // don't appear again.
  useEffect(() => {
    globalErrorMessages.forEach(({ title, description, id }) => {
      toast({
        title,
        description,
        status: 'error',
        duration: 9000,
        position: 'bottom-right',
        isClosable: true
      });

      dispatch(appSlice.actions.removeGlobalErrorMessage(id));
    });
  }, [dispatch, globalErrorMessages, toast]);

  return null;
};
