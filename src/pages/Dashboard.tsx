import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { adminWallets } from '../data/users';

const categories = ["All Categories", "Novice", "Adept", "Master", "Legendary"] as const;
const rewardTypes = ["All Rewards", "DRC-20 TOKENS", "Dunes", "TAP Protocol tokens", "DogeOS tokens", "Whitelist", "doginals"] as const;
const statusTypes = ["All Status", "Active", "Inactive", "Pending"] as const;

type Category = (typeof categories)[number];
type RewardType = (typeof rewardTypes)[number];
type StatusType = (typeof statusTypes)[number];

function CustomDropdown<T extends string>({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: T; 
  onChange: (value: T) => void; 
  options: readonly T[]; 
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-dnk-surface border border-dnk-accent/20 rounded-lg px-3 py-2 md:px-4 md:py-2 text-text-light text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent text-left flex items-center justify-between"
      >
        <span>{value || placeholder}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-dnk-surface border border-dnk-accent/20 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 md:px-4 md:py-2 text-sm md:text-base hover:bg-dnk-accent/10 transition-colors ${
                value === option ? 'bg-dnk-primary/20 text-dnk-primary-light' : 'text-text-light'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface QuestStats {
  totalQuests: number;
  activeQuests: number;
  completedQuests: number;
  totalEngagement: number;
  totalRewards: number;
}

function Dashboard() {
  const { 
    currentUser, 
    quests, 
    questSubmissions, 
    approveSubmission, 
    rejectSubmission, 
    getAllUsers,
    deleteQuest,
    updateQuest,
    markWhitelistWinner
  } = useStore();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'quests' | 'users'>('overview');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionSubmissionId, setRejectionSubmissionId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>("All Categories");
  const [selectedRewardType, setSelectedRewardType] = useState<RewardType>("All Rewards");
  const [selectedStatus, setSelectedStatus] = useState<StatusType>("All Status");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = currentUser && adminWallets.includes(currentUser.wallet.toLowerCase());

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-header text-dnk-primary mb-4">Connect Wallet Required</h2>
        <p className="text-text-muted">Please connect your wallet to access the dashboard.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-header text-dnk-primary mb-4">Access Denied</h2>
        <p className="text-text-muted">You don't have admin privileges to access this dashboard.</p>
      </div>
    );
  }

  const pendingSubmissions = questSubmissions.filter(s => s.status === 'pending');
  const approvedSubmissions = questSubmissions.filter(s => s.status === 'approved');
  const rejectedSubmissions = questSubmissions.filter(s => s.status === 'rejected');

  // Filter to show user's own submitted quests when viewing their dashboard
  const userSubmittedQuests = quests.filter(q => q.submittedBy === currentUser?.wallet);
  const allUsers = getAllUsers();

  // Filter quests based on selected filters
  const filteredQuests = quests.filter(quest => {
    if (selectedCategory !== "All Categories" && quest.category !== selectedCategory) return false;
    if (selectedRewardType !== "All Rewards" && quest.rewardType !== selectedRewardType) return false;
    if (selectedStatus !== "All Status") {
      const questStatus = quest.status || 'Active'; // Default to Active if no status
      if (questStatus !== selectedStatus) return false;
    }
    if (searchQuery && !quest.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats: QuestStats = {
    totalQuests: quests.length,
    activeQuests: quests.filter(q => q.status === 'active').length,
    completedQuests: allUsers.reduce((total, user) => total + user.completed.length, 0),
    totalEngagement: allUsers.reduce((total, user) => total + user.completed.length, 0),
    totalRewards: allUsers.reduce((total, user) => total + user.xp, 0)
  };

  const handleApproveSubmission = (submissionId: string) => {
    approveSubmission(submissionId);
  };

  const handleRejectSubmission = (submissionId: string) => {
    if (rejectionReason.trim()) {
      rejectSubmission(submissionId, rejectionReason);
      setRejectionReason('');
      setRejectionSubmissionId('');
    }
  };

  const getQuestTitle = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    return quest?.title || 'Unknown Quest';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

    // Aggregate quest completion data
    const questCompletions = quests.map(quest => {
      const completedUsers = allUsers.filter(user => user.completed.includes(quest.id));
      const completionCount = completedUsers.length;
      return { quest, completedUsers, completionCount };
    });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-dnk-primary mb-2">Admin Dashboard</h1>
        <p className="text-text-muted">Manage your quests, review submissions, and track community activity</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-6 mb-8 border-b border-dnk-accent/20">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`pb-4 px-2 font-medium transition-colors ${
            selectedTab === 'overview' 
              ? 'text-dnk-primary border-b-2 border-dnk-primary' 
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedTab('quests')}
          className={`pb-4 px-2 font-medium transition-colors ${
            selectedTab === 'quests' 
              ? 'text-dnk-primary border-b-2 border-dnk-primary' 
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          Manage Quests
        </button>
        <button
          onClick={() => setSelectedTab('users')}
          className={`pb-4 px-2 font-medium transition-colors ${
            selectedTab === 'users' 
              ? 'text-dnk-primary border-b-2 border-dnk-primary' 
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          Users
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-6">
              <div className="text-2xl font-bold text-dnk-primary mb-2">{stats.totalQuests}</div>
              <div className="text-text-muted text-sm">Total Quests</div>
            </div>
            <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-6">
              <div className="text-2xl font-bold text-green-400 mb-2">{stats.activeQuests}</div>
              <div className="text-text-muted text-sm">Active Quests</div>
            </div>
            <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-6">
              <div className="text-2xl font-bold text-blue-400 mb-2">{stats.completedQuests}</div>
              <div className="text-text-muted text-sm">Completed</div>
            </div>
            <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-6">
              <div className="text-2xl font-bold text-yellow-400 mb-2">{stats.totalEngagement}</div>
              <div className="text-text-muted text-sm">Total Submissions</div>
            </div>
            <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-6">
              <div className="text-2xl font-bold text-purple-400 mb-2">{stats.totalRewards}</div>
              <div className="text-text-muted text-sm">Points Awarded</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-6">
            <h2 className="text-xl font-semibold text-dnk-primary mb-6">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/admin"
                className="bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span>✨</span>
                Submit New Quest
              </Link>
              <button
                onClick={() => setSelectedTab('quests')}
                className="bg-blue-500 hover:bg-blue-600 text-dnk-surface px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span>⚙️</span>
                Manage Quests
              </button>
              <button
                onClick={() => setSelectedTab('users')}
                className="bg-dnk-accent hover:bg-dnk-accent/80 text-dnk-surface px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span>👥</span>
                Manage Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quest Management Tab */}
      {selectedTab === 'quests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-dnk-primary">Quest Management</h2>
                <Link
                  to="/admin"
                  className="bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Create New Quest
                </Link>
              </div>

              {/* Filters */}
              <div className="bg-dnk-secondary/30 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {/* Category Filter */}
                  <CustomDropdown
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categories}
                  />

                  {/* Reward Type Filter */}
                  <CustomDropdown
                    value={selectedRewardType}
                    onChange={setSelectedRewardType}
                    options={rewardTypes}
                  />

                  {/* Status Filter */}
                  <CustomDropdown
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={statusTypes}
                  />

                  {/* Search */}
                  <div>
                    <input
                      type="text"
                      placeholder="Search quests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-dnk-surface border border-dnk-accent/20 rounded-lg px-3 py-2 md:px-4 md:py-2 text-text-light text-sm md:text-base focus:outline-none focus:border-dnk-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Quest Completion Analytics */}
              <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-6">
                <h3 className="text-lg font-medium text-dnk-primary mb-4">Quest Completion Analytics ({filteredQuests.length} quests)</h3>
                <div className="space-y-4">
                  {questCompletions
                    .filter(({ quest }) => filteredQuests.includes(quest))
                    .sort((a, b) => b.completionCount - a.completionCount)
                    .map(({ quest, completedUsers, completionCount }) => (
                    <div key={quest.id} className="bg-dnk-surface/30 rounded-lg p-4 border border-dnk-accent/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-text-light font-medium">{quest.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-text-muted">
                            <span>{quest.category}</span>
                            <span>•</span>
                            <span>{completionCount} users completed</span>
                            <span>•</span>
                            <span>{quest.reward} points reward</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-dnk-primary-light font-medium">{quest.dogecoinAmount} DOGE</div>
                          <div className="text-text-muted text-xs">per completion</div>
                        </div>
                      </div>

                      {completedUsers.length > 0 ? (
                        <details className="mt-3">
                          <summary className="text-dnk-primary cursor-pointer text-sm hover:text-dnk-primary-light">
                            View completed wallet addresses ({completionCount})
                            {quest.rewardType === 'whitelist' && (
                              <span className="ml-2 text-green-400">
                                ({(quest.whitelistWinners || []).length} winners)
                              </span>
                            )}
                          </summary>
                          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                            {completedUsers.map(user => {
                              const isWhitelistWinner = quest.whitelistWinners?.includes(user.wallet) || false;
                              return (
                                <div key={user.wallet} className="flex items-center justify-between bg-dnk-secondary/20 rounded px-3 py-2 text-sm">
                                  <div className="flex items-center space-x-3">
                                    <code className="text-text-light bg-dnk-secondary/50 px-2 py-1 rounded text-xs">
                                      {user.wallet}
                                    </code>
                                    <span className="text-text-muted">({user.alias})</span>
                                    {quest.rewardType === 'whitelist' && isWhitelistWinner && (
                                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                                        Winner
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-dnk-primary-light">{user.xp} XP</span>
                                    {quest.rewardType === 'whitelist' && (
                                      <button
                                        onClick={() => markWhitelistWinner(quest.id, user.wallet, !isWhitelistWinner)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                          isWhitelistWinner
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                        }`}
                                      >
                                        {isWhitelistWinner ? 'Remove' : 'Mark Winner'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      ) : (
                        <div className="mt-3 text-text-muted text-sm italic">
                          No users have completed this quest yet
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20">
                <div className="p-6 border-b border-dnk-accent/20">
                  <h2 className="text-xl font-semibold text-dnk-primary flex items-center gap-2">
                    <span>⚙️</span>
                    Quest Management
                  </h2>
                </div>
                <div className="divide-y divide-dnk-accent/20">
                  {filteredQuests.map((quest) => (
                    <div key={quest.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-dnk-primary">{quest.title}</h3>
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-dnk-primary/20 text-dnk-primary-light">
                              {quest.category}
                            </span>
                            {quest.submittedBy && (
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                                User Submitted
                              </span>
                            )}
                          </div>
                          <p className="text-text-muted text-sm mb-2">{quest.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-dnk-primary-light">{quest.reward} Points</span>
                            <span className="text-orange-400">{quest.dogecoinAmount} DOGE</span>
                            <span className="text-text-muted">{quest.steps.length} tasks</span>
                            {quest.submittedBy && (
                              <span className="text-text-muted">By: {quest.submittedBy}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Link
                            to={`/admin/edit/${quest.id}`}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this quest?')) {
                                deleteQuest(quest.id);
                              }
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20">
          <div className="p-6 border-b border-dnk-accent/20">
            <h2 className="text-xl font-semibold text-dnk-primary">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dnk-surface/50">
                <tr>
                  <th className="text-left p-4 text-text-muted font-medium">Rank</th>
                  <th className="text-left p-4 text-text-muted font-medium">User</th>
                  <th className="text-left p-4 text-text-muted font-medium">Wallet</th>
                  <th className="text-left p-4 text-text-muted font-medium">XP</th>
                  <th className="text-left p-4 text-text-muted font-medium">Completed Quests</th>
                  <th className="text-left p-4 text-text-muted font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dnk-accent/20">
                {allUsers.map((user) => (
                  <tr key={user.wallet} className="hover:bg-dnk-surface/20">
                    <td className="p-4">
                      <span className="text-dnk-primary font-medium">#{user.rank}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-dnk-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-dnk-primary text-sm font-medium">
                            {user.alias.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-text-light font-medium">{user.alias}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-text-muted font-mono text-sm">{user.wallet}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-dnk-primary-light font-medium">{user.xp}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-text-light">{user.completed.length}</span>
                    </td>
                    <td className="p-4">
                      {adminWallets.includes(user.wallet.toLowerCase()) ? (
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">
                          User
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;