import { useStore } from '../store/useStore';
import { useState, useEffect } from 'react';

export function Leaderboard() {
  const { getAllUsers, currentUser } = useStore();
  const [sortedUsers, setSortedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const users = await getAllUsers(); 
      setSortedUsers(users);
      setError('');
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Loading leaderboard...</p>
      </div>
    );
    
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-header text-dnk-primary mb-4">Leaderboard</h1>
        <p className="text-text-muted max-w-2xl mx-auto">
          See who's leading the quest completion rankings. Complete more quests to earn points and climb to the top of the leaderboard.
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Second Place */}
        {sortedUsers[1] && (
          <div className="order-2 md:order-1">
            <div className="bg-dnk-secondary/50 rounded-lg p-6 border border-dnk-accent/20 text-center">
              <div className="w-16 h-16 bg-gray-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-header text-gray-400">
                  {sortedUsers[1].alias.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">{sortedUsers[1].alias}</h3>
              <p className="text-gray-400 font-medium">{sortedUsers[1].xp} Points</p>
              <div className="mt-4">
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-gray-400/20 text-gray-400">
                  #2
                </span>
              </div>
            </div>
          </div>
        )}

        {/* First Place */}
        {sortedUsers[0] && (
          <div className="order-1 md:order-2">
            <div className="bg-dnk-secondary/50 rounded-lg p-8 border-2 border-dnk-primary/40 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="inline-block px-4 py-2 text-sm rounded-full bg-dnk-primary text-dnk-surface font-bold">
                  Top Performer
                </span>
              </div>
              <div className="w-20 h-20 bg-dnk-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-header text-dnk-primary">
                  {sortedUsers[0].alias.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-medium text-dnk-primary mb-2">{sortedUsers[0].alias}</h3>
              <p className="text-dnk-primary-light font-medium text-lg">{sortedUsers[0].xp} Points</p>
              <div className="mt-4">
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-dnk-primary/20 text-dnk-primary-light">
                  #1
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Third Place */}
        {sortedUsers[2] && (
          <div className="order-3">
            <div className="bg-dnk-secondary/50 rounded-lg p-6 border border-dnk-accent/20 text-center">
              <div className="w-16 h-16 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-header text-amber-600">
                  {sortedUsers[2].alias.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-medium text-amber-600 mb-2">{sortedUsers[2].alias}</h3>
              <p className="text-amber-600 font-medium">{sortedUsers[2].xp} Points</p>
              <div className="mt-4">
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-amber-600/20 text-amber-600">
                  #3
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Leaderboard */}
      <div className="bg-dnk-secondary/30 rounded-lg border border-dnk-accent/20 overflow-hidden">
        <div className="p-6 border-b border-dnk-accent/20">
          <h2 className="text-xl font-header text-dnk-primary">All Participants</h2>
        </div>
        <div className="divide-y divide-dnk-accent/20">
          {sortedUsers.map((user, index) => (
            <div
              key={user.wallet}
              className={`p-6 flex items-center justify-between hover:bg-dnk-secondary/20 transition-colors duration-150 ${
                currentUser?.wallet === user.wallet ? 'bg-dnk-primary/10 border-l-4 border-dnk-primary' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-dnk-primary/20 rounded-full flex items-center justify-center">
                  <span className="font-header text-dnk-primary">
                    {user.alias.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-text-light">
                    {user.alias}
                    {currentUser?.wallet === user.wallet && (
                      <span className="ml-2 text-sm text-dnk-primary">(You)</span>
                    )}
                  </h3>
                  <p className="text-sm text-text-muted">Rank #{index + 1} on Leaderboard</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-dnk-primary-light">{user.xp} Points</p>
                <p className="text-sm text-text-muted">#{index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
