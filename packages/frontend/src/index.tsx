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

import { ChakraProvider, ColorModeScript, createStandaloneToast, useColorMode } from '@chakra-ui/react';
import type { DOMAttributes } from 'react';
import { createRoot } from 'react-dom/client';
import { Helmet } from 'react-helmet';
import { Provider as Redux } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as UrqlProvider } from 'urql';

import { AnalyticsHandler } from './components/analytics-handler/analytics-handler';
import { GlobalErrors } from './pages/main-page/components/global-errors/global-errors';
import { MainPage } from './pages/main-page/main-page';
import { initSettings } from './store/app.slice';
import { store, persistor } from './store/store';
import { IexTheme } from './theme';
import { urqlClient, provideStore } from './urql';

// Initialize app-level settings
store.dispatch(initSettings());

const GraphQLClient = ({ children }: DOMAttributes<unknown>) => {
  // HACK: Initializing here to avoid circular references
  // But this doesn't feel very clean...
  provideStore(store);
  return <UrqlProvider value={urqlClient}>{children}</UrqlProvider>;
};

const App = () => {
  return (
    <>
      <ColorModeScript initialColorMode={IexTheme.config.initialColorMode} />
      <ChakraProvider resetCSS theme={IexTheme} portalZIndex={10}>
        <Redux store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <GraphQLClient>
              <BrowserRouter>
                <>
                  <AnalyticsHandler />
                  <Helmet defaultTitle="Insights Explorer" titleTemplate="%s | IEX" />
                  <MainPage />
                </>
                <GlobalErrors />
              </BrowserRouter>
            </GraphQLClient>
          </PersistGate>
        </Redux>
      </ChakraProvider>
    </>
  );
};

const { ToastContainer } = createStandaloneToast();

const container = document.querySelector('#root') as Element;
const root = createRoot(container);
root.render(
  <>
    <App />
    <ToastContainer />
  </>
);
