import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export function Profile() {
  const { currentUser, userSocialAccounts, updateSocialAccounts } = useStore();
  const [socialAccounts, setSocialAccounts] = useState({
    twitter: '',
    discord: '',
    telegram: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchSocials = async () => {
      if (!currentUser?.wallet) return;
      try {
        const res = await fetch(`https://dnkquest-backend.vercel.app/api/user/${currentUser.wallet}/socials`);
        const data = await res.json();
        setSocialAccounts({
          twitter: data.accounts?.twitter || '',
          discord: data.accounts?.discord || '',
          telegram: data.accounts?.telegram || ''
        });
        updateSocialAccounts(currentUser.wallet, data.accounts);
      } catch (err) {
        console.error('Failed to load social accounts:', err);
      }
    };

    fetchSocials();
  }, [currentUser?.wallet]);

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-header text-dnk-primary mb-4">Connect Wallet Required</h2>
        <p className="text-text-muted">Please connect your wallet to view your profile.</p>
      </div>
    );
  }

  const handleSocialAccountChange = (platform: string, value: string) => {
    setSocialAccounts(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleSaveSocialAccounts = async () => {
    if (!currentUser) return;

    try {
      const res = await fetch(`https://dnkquest-backend.vercel.app/api/user/${currentUser.wallet}/socials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: socialAccounts }),
      });

      if (!res.ok) throw new Error('Failed to save');

      updateSocialAccounts(currentUser.wallet, socialAccounts);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save socials:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-full bg-dnk-primary/20 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-dnk-primary">
            {currentUser.alias.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-3xl font-header text-dnk-primary mb-2">{currentUser.alias}</h1>
        <p className="text-text-muted text-sm font-mono">{currentUser.wallet}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dnk-secondary/50 rounded-lg p-6 text-center border border-dnk-accent/20">
          <div className="text-3xl font-bold text-dnk-primary mb-2">{currentUser.xp}</div>
          <div className="text-text-muted">Total XP</div>
        </div>
        <div className="bg-dnk-secondary/50 rounded-lg p-6 text-center border border-dnk-accent/20">
          <div className="text-3xl font-bold text-dnk-primary mb-2">#{currentUser.rank}</div>
          <div className="text-text-muted">Leaderboard Rank</div>
        </div>
        <div className="bg-dnk-secondary/50 rounded-lg p-6 text-center border border-dnk-accent/20">
          <div className="text-3xl font-bold text-dnk-primary mb-2">{currentUser.completed.length}</div>
          <div className="text-text-muted">Quests Completed</div>
        </div>
      </div>

      <div className="bg-dnk-secondary/50 rounded-lg p-6 border border-dnk-accent/20 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-header text-dnk-primary">Social Accounts</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-4 py-2 rounded-lg font-medium transition-colors duration-150"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-light mb-1">Twitter</label>
              {isEditing ? (
                <input
                  type="text"
                  value={socialAccounts.twitter}
                  onChange={(e) => handleSocialAccountChange('twitter', e.target.value)}
                  placeholder="@username"
                  className="w-full bg-dnk-surface border border-dnk-accent/20 rounded-lg px-3 py-2 text-text-light focus:outline-none focus:border-dnk-primary"
                />
              ) : (
                <div className="text-text-muted">
                  {socialAccounts.twitter || 'Not connected'}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-light mb-1">Discord</label>
              {isEditing ? (
                <input
                  type="text"
                  value={socialAccounts.discord}
                  onChange={(e) => handleSocialAccountChange('discord', e.target.value)}
                  placeholder="username#1234"
                  className="w-full bg-dnk-surface border border-dnk-accent/20 rounded-lg px-3 py-2 text-text-light focus:outline-none focus:border-dnk-primary"
                />
              ) : (
                <div className="text-text-muted">
                  {socialAccounts.discord || 'Not connected'}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-light mb-1">Telegram</label>
              {isEditing ? (
                <input
                  type="text"
                  value={socialAccounts.telegram}
                  onChange={(e) => handleSocialAccountChange('telegram', e.target.value)}
                  placeholder="@username"
                  className="w-full bg-dnk-surface border border-dnk-accent/20 rounded-lg px-3 py-2 text-text-light focus:outline-none focus:border-dnk-primary"
                />
              ) : (
                <div className="text-text-muted">
                  {socialAccounts.telegram || 'Not connected'}
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleSaveSocialAccounts}
              className="bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-6 py-2 rounded-lg font-medium transition-colors duration-150"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="bg-dnk-secondary/50 rounded-lg p-6 border border-dnk-accent/20">
        <h2 className="text-xl font-header text-dnk-primary mb-4">Completed Quests</h2>
        {currentUser.completed.length > 0 ? (
          <div className="space-y-2">
            {currentUser.completed.map((questId, index) => (
              <div key={questId} className="flex items-center justify-between py-2 px-3 bg-dnk-surface/50 rounded-lg">
                <span className="text-text-light">Quest #{questId}</span>
                <span className="text-dnk-primary-light text-sm">Completed</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted">No quests completed yet. Start your journey!</p>
        )}
      </div>
    </div>
  );
}
