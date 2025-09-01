import { Provider } from 'react-redux';
import { store } from '../store';
import { Web3Provider } from '../lib/WagmiProvider';
import Layout from '../components/Layout/Layout';
import ErrorBoundary from '../components/UI/ErrorBoundary';
import '../app/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Web3Provider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </Web3Provider>
      </Provider>
    </ErrorBoundary>
  );
}