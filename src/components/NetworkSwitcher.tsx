
import { useState } from 'react';
import { switchToDogeOSForPayment, getCurrentChainId, getNetworkName, isDogeOSNetwork } from '../utils/wallet';

interface NetworkSwitcherProps {
  onNetworkSwitch?: () => void;
  isVisible: boolean;
}

export function NetworkSwitcher({ onNetworkSwitch, isVisible }: NetworkSwitcherProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<string>('');

  const checkCurrentNetwork = async () => {
    try {
      const chainId = await getCurrentChainId();
      setCurrentNetwork(getNetworkName(chainId));
      return chainId;
    } catch (error) {
      console.error('Failed to get current network:', error);
      return null;
    }
  };

  const handleSwitchToDogeOS = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to use this feature.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First ensure user is connected
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Then switch to DogeOS network
      await switchToDogeOSForPayment(window.ethereum);
      
      // Check network after switch
      await checkCurrentNetwork();
      onNetworkSwitch?.();
    } catch (error: any) {
      console.error('Error switching to DogeOS:', error);
      setError(error.message || 'Failed to switch to DogeOS. Please try again or check your MetaMask settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkNetworkStatus = async () => {
    const chainId = await checkCurrentNetwork();
    return chainId ? isDogeOSNetwork(chainId) : false;
  };

  if (!isVisible) return null;

  return (
    <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-dnk-primary font-medium">Network Required</h3>
        <span className="text-sm text-text-muted">{currentNetwork}</span>
      </div>
      
      <p className="text-text-muted text-sm mb-4">
        To complete payment transactions, please switch to DogeOS Devnet.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleSwitchToDogeOS}
        disabled={isLoading}
        className="w-full bg-dnk-primary hover:bg-dnk-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-dnk-surface px-4 py-2 rounded-lg font-medium transition-colors duration-150"
      >
        {isLoading ? 'Switching...' : 'Switch to DogeOS Devnet'}
      </button>
    </div>
  );
}
