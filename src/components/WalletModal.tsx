
import { useState } from 'react';
import { connectMetaMask, connectMyDoge, detectWallets } from '../utils/wallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string, walletType: string) => void;
}

export function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasMetaMask, hasMyDoge } = detectWallets();

  if (!isOpen) return null;

  const handleConnect = async (walletType: 'metamask' | 'mydoge') => {
    setIsConnecting(true);
    setError(null);

    try {
      let accounts: string[];
      if (walletType === 'metamask') {
        accounts = await connectMetaMask();
      } else {
        accounts = await connectMyDoge();
      }

      if (accounts && accounts.length > 0) {
        onConnect(accounts[0], walletType);
        onClose();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const openWalletDownload = (wallet: 'metamask' | 'mydoge') => {
    const urls = {
      metamask: 'https://metamask.io/',
      mydoge: 'https://mydoge.com/',
    };
    window.open(urls[wallet], '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dnk-secondary rounded-lg border border-dnk-accent/20 p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-header text-dnk-primary">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-light"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-text-muted text-sm mb-4">
            Connect your wallet to participate in quests and earn rewards. Any EVM-compatible network is supported.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* MetaMask */}
          <div className="border border-dnk-accent/20 rounded-lg p-4 hover:border-dnk-accent/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-orange-500 flex items-center justify-center">
                  <img
                    src="./metamask-logo.png"
                    alt="MetaMask"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<span class="text-white font-bold text-sm">M</span>';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-text-light font-medium">MetaMask</h3>
                  <p className="text-text-muted text-sm">Connect using MetaMask</p>
                </div>
              </div>
              {hasMetaMask ? (
                <button
                  onClick={() => handleConnect('metamask')}
                  disabled={isConnecting}
                  className="bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-4 py-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              ) : (
                <button
                  onClick={() => openWalletDownload('metamask')}
                  className="bg-dnk-accent hover:bg-dnk-accent/80 text-text-light px-4 py-2 rounded-lg font-medium transition-colors duration-150"
                >
                  Install
                </button>
              )}
            </div>
          </div>

          {/* MyDoge */}
          <div className="border border-dnk-accent/20 rounded-lg p-4 hover:border-dnk-accent/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-yellow-500 flex items-center justify-center">
                  <img
                    src="./mydoge-logo.png"
                    alt="MyDoge"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<span class="text-white font-bold text-sm">D</span>';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-text-light font-medium">MyDoge</h3>
                  <p className="text-text-muted text-sm">Connect using MyDoge wallet</p>
                </div>
              </div>
              {hasMyDoge ? (
                <button
                  onClick={() => handleConnect('mydoge')}
                  disabled={isConnecting}
                  className="bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-4 py-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              ) : (
                <button
                  onClick={() => openWalletDownload('mydoge')}
                  className="bg-dnk-accent hover:bg-dnk-accent/80 text-text-light px-4 py-2 rounded-lg font-medium transition-colors duration-150"
                >
                  Install
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-dnk-primary/10 rounded-lg border border-dnk-primary/20">
            <h4 className="text-dnk-primary font-medium mb-2">EVM Network Support</h4>
            <div className="text-sm text-text-muted space-y-1">
              <p>• Supports any EVM-compatible network</p>
              <p>• Payments require DogeOS Devnet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
