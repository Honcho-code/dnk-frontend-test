import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { WalletModal } from './WalletModal';
import { adminWallets } from '../data/users';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { currentUser, isConnected, connectWallet, disconnectWallet } = useStore();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  const handleWalletConnect = () => {
    if (!isConnected) {
      setShowWalletModal(true);
    } else {
      disconnectWallet();
    }
  };

  const handleWalletModalConnect = () => {
    connectWallet();
  };

  return (
    <div className="min-h-screen flex flex-col bg-dnk-surface text-text-light">
      <nav className="sticky top-0 z-50 bg-dnk-secondary/80 backdrop-blur-sm border-b border-dnk-accent/20">
        <div className="max-w-[1080px] mx-auto px-4 md:px-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🧪</span>
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link
                    to="/quests"
                    className={`${
                      isActive('/quests')
                        ? 'text-dnk-primary border-b-2 border-dnk-primary'
                        : 'text-text-light hover:text-dnk-primary'
                    } px-3 py-2 text-sm font-medium transition-colors duration-150`}
                  >
                    Quests
                  </Link>
                  <Link
                    to="/profile"
                    className={`${
                      isActive('/profile')
                        ? 'text-dnk-primary border-b-2 border-dnk-primary'
                        : 'text-text-light hover:text-dnk-primary'
                    } px-3 py-2 text-sm font-medium transition-colors duration-150`}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/leaderboard"
                    className={`${
                      isActive('/leaderboard')
                        ? 'text-dnk-primary border-b-2 border-dnk-primary'
                        : 'text-text-light hover:text-dnk-primary'
                    } px-3 py-2 text-sm font-medium transition-colors duration-150`}
                  >
                    Leaderboard
                  </Link>
                  <Link
                    to="/admin"
                    className={`${
                      isActive('/admin')
                        ? 'text-dnk-primary border-b-2 border-dnk-primary'
                        : 'text-text-light hover:text-dnk-primary'
                    } px-3 py-2 text-sm font-medium transition-colors duration-150`}
                  >
                    Submit Quest
                  </Link>
                  {isConnected && currentUser && adminWallets.includes(currentUser.wallet.toLowerCase()) && (
                    <Link
                      to="/dashboard"
                      className={`${
                        isActive('/dashboard')
                          ? 'text-dnk-primary border-b-2 border-dnk-primary'
                          : 'text-text-light hover:text-dnk-primary'
                      } px-3 py-2 text-sm font-medium transition-colors duration-150`}
                    >
                      Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              {isConnected && currentUser ? (
                <div className="flex items-center space-x-2">
                  <div className="hidden md:flex flex-col text-right text-xs">
                    {/* <span className="text-text-muted">{currentNetwork}</span>
                    <span className="text-dnk-primary-light">{balance} {networkSymbol}</span> */}
                  </div>
                  <button
                    onClick={handleWalletConnect}
                    className="bg-dnk-primary/20 hover:bg-dnk-primary/30 text-dnk-primary-light px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium transition-colors duration-150 text-sm md:text-base"
                  >
                    {currentUser.alias}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleWalletConnect}
                  className="bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium transition-colors duration-150 text-sm md:text-base"
                >
                  Connect Wallet 
                </button>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-dnk-accent/20"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="w-6 h-6 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-dnk-accent/20 mt-4">
              <div className="flex flex-col space-y-2 pt-4">
                <Link
                  to="/quests"
                  className={`${
                    isActive('/quests')
                      ? 'text-dnk-primary bg-dnk-primary/10'
                      : 'text-text-light hover:text-dnk-primary hover:bg-dnk-accent/10'
                  } px-3 py-2 text-sm font-medium transition-colors duration-150 rounded-lg`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Quests
                </Link>
                <Link
                  to="/profile"
                  className={`${
                    isActive('/profile')
                      ? 'text-dnk-primary bg-dnk-primary/10'
                      : 'text-text-light hover:text-dnk-primary hover:bg-dnk-accent/10'
                  } px-3 py-2 text-sm font-medium transition-colors duration-150 rounded-lg`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/leaderboard"
                  className={`${
                    isActive('/leaderboard')
                      ? 'text-dnk-primary bg-dnk-primary/10'
                      : 'text-text-light hover:text-dnk-primary hover:bg-dnk-accent/10'
                  } px-3 py-2 text-sm font-medium transition-colors duration-150 rounded-lg`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Leaderboard
                </Link>
                <Link
                  to="/admin"
                  className={`${
                    isActive('/admin')
                      ? 'text-dnk-primary bg-dnk-primary/10'
                      : 'text-text-light hover:text-dnk-primary hover:bg-dnk-accent/10'
                  } px-3 py-2 text-sm font-medium transition-colors duration-150 rounded-lg`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Submit Quest
                </Link>
                {isConnected && currentUser && adminWallets.includes(currentUser.wallet.toLowerCase()) && (
                  <Link
                    to="/dashboard"
                    className={`${
                      isActive('/dashboard')
                        ? 'text-dnk-primary bg-dnk-primary/10'
                        : 'text-text-light hover:text-dnk-primary hover:bg-dnk-accent/10'
                    } px-3 py-2 text-sm font-medium transition-colors duration-150 rounded-lg`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                {isConnected && currentUser && (
                  <div className="sm:hidden px-3 py-2 text-sm text-text-muted border-t border-dnk-accent/20 mt-2 pt-4">
                    {currentUser.alias} ({currentUser.xp} Points)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-grow">
        <div className="max-w-[1080px] mx-auto px-4 md:px-10 py-6 md:py-10">
          {children}
        </div>
      </main>

      <footer className="bg-dnk-secondary/80 border-t border-dnk-accent/20 py-8 md:py-12">
        <div className="max-w-[1080px] mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="space-y-4 sm:col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/logo.png" alt="DNK" className="h-8 w-8" />
              </Link>
              <p className="text-text-muted text-sm">Complete quests, earn points, climb the leaderboard.</p>
            </div>
            <div>
              <h3 className="text-dnk-primary font-medium mb-4 text-sm">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/quests" className="text-text-muted hover:text-dnk-primary text-sm">Quests</Link></li>
                <li><Link to="/profile" className="text-text-muted hover:text-dnk-primary text-sm">Profile</Link></li>
                <li><Link to="/leaderboard" className="text-text-muted hover:text-dnk-primary text-sm">Leaderboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-dnk-primary font-medium mb-4 text-sm">Community</h3>
              <ul className="space-y-2">
                <li><Link to="/wizards-circle" className="text-text-muted hover:text-dnk-primary text-sm">Discord Council</Link></li>
                <li><Link to="/https://twitter.com/DnkQuest" className="text-text-muted hover:text-dnk-primary text-sm">Mystic Twitter</Link></li>
                <li><Link to="https://t.me/doginalnonkycex" className="text-text-muted hover:text-dnk-primary text-sm">Arcane Telegram</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-dnk-primary font-medium mb-4 text-sm">Project Owners</h3>
              <ul className="space-y-2">
                <li><Link to="/dashboard" className="text-text-muted hover:text-dnk-primary text-sm">Quest Dashboard</Link></li>
                <li>
                <Link
              to="/admin"
              className="text-text-muted hover:text-dnk-primary text-sm"
            >
              Launch Quest
            </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-dnk-accent/20 text-center text-text-muted">
            <p className="text-xs md:text-sm">&copy; {new Date().getFullYear()} School of Magic. All rights reserved by Doginal Non-KYC Ventures.</p>
          </div>
        </div>
      </footer>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletModalConnect}
      />
    </div>
  );
}