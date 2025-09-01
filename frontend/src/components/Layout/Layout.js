import Header from './Header';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUserInfo } from '../../store/slices/userSlice';

export default function Layout({ children }) {
  const { address, isConnected, chain } = useAccount();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setUserInfo({
      address,
      isConnected,
      chainId: chain?.id,
    }));
  }, [address, isConnected, chain, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}