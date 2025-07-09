import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { type Quest } from '../data/quests';

function CustomDropdown<T extends string>({ 
  value, 
  onChange, 
  options, 
  placeholder,
  required = false 
}: { 
  value: T; 
  onChange: (value: T) => void; 
  options: readonly T[]; 
  placeholder?: string;
  required?: boolean;
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
        className="w-full bg-dnk-surface border border-dnk-accent/20 rounded-lg px-4 py-3 text-text-light focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent text-left flex items-center justify-between hover:border-dnk-accent/40 transition-colors"
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
              className={`w-full text-left px-4 py-3 hover:bg-dnk-accent/10 transition-colors ${
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

function Admin() {
  const navigate = useNavigate();
  const { currentUser, addQuest } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    title: '',
    description: '',
    category: 'Novice',
    rewardType: 'DRC-20 TOKENS',
    dogecoinAmount: '',
    tokenTicker: '',
    tokenAmount: '',
    projectUrl: '',
    socialLinks: {
      twitter: '',
      discord: '',
      website: ''
    }
  });

  const [tasks, setTasks] = useState([
    {
      id: Date.now(),
      description: '',
      type: 'text',
      proofRequired: false
    }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const addTask = () => {
    setTasks(prev => [...prev, {
      id: Date.now(),
      description: '',
      type: 'text',
      proofRequired: false
    }]);
  };

  const removeTask = (taskId: number) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const updateTask = (taskId: number, field: string, value: any) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    if (!formData.projectName || !formData.title || !formData.description || !formData.dogecoinAmount || !formData.tokenTicker || !formData.tokenAmount) {
        alert('Please fill in all required fields');
        return;
      }

    try {
      let paymentResult = { success: true, transactionHash: null };

      // Skip payment for whitelist quests
      if (formData.rewardType !== 'whitelist') {
        // First, request payment approval
        paymentResult = await requestPaymentApproval(formData.dogecoinAmount);

        if (!paymentResult.success) {
          alert(`Payment failed: ${paymentResult.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Only proceed with quest creation if payment was successful or whitelist quest

      // Generate unique quest ID
      const questId = `quest_${Date.now()}`;

      // Convert tasks to quest steps
      const steps = tasks
        .filter(task => task.description.trim())
        .map((task, index) => ({
          step: task.description.trim(),
          type: task.type as any,
          proofRequired: task.proofRequired
        }));

      // Create quest object
      const questData = {
        title: formData.title,
        description: formData.description,
        category: formData.category as any,
        rewardType: formData.rewardType as any,
        deadline: formData.deadline,
        steps,
        projectName: formData.projectName,
        projectUrl: formData.projectUrl,
        socialLinks: formData.socialLinks
      };
      const result = await createQuestAfterPayment(questData, paymentResult.transactionHash, formData.dogecoinAmount);

      if (result.success) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'Novice',
          rewardType: 'DRC-20 TOKENS',
          dogecoinAmount: '',
          tokenTicker: '',
          tokenAmount: '',
          projectName: '',
          projectUrl: '',
          socialLinks: {
            twitter: '',
            discord: '',
            website: ''
          }
        });
        setTasks([{
          id: Date.now(),
          description: '',
          type: 'text',
          proofRequired: false
        }]);
        const message = formData.rewardType === 'whitelist' 
          ? 'Quest created successfully! Whitelist quest created without payment requirement.'
          : 'Quest created successfully! Payment has been processed and DOGE has been deducted from your wallet.';
        alert(message);
      } else {
        alert(`Failed to create quest: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating quest:', error);
      alert('Failed to create quest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestPaymentApproval = async (dogecoinAmount: any) => {
    if (!currentUser) {
      return { success: false, error: "Please connect your wallet first." };
    }

    try {
      if (window.ethereum) {
        const web3 = new (await import('web3')).default(window.ethereum);

        // Convert DOGE amount to Wei (18 decimals)
        // Ensure dogecoinAmount is treated as a decimal number
        const dogeAmount = parseFloat(dogecoinAmount.toString());

        // For DogeOS network, DOGE has 18 decimals like ETH
        // Convert the decimal DOGE amount to the smallest unit (wei equivalent)
        const amountWei = web3.utils.toWei(dogeAmount.toString(), 'ether');

        // Request payment transaction to the admin wallet
        const tx = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: currentUser.wallet,
            to: '0xbF82E1ea36e2a7E19F7D014De7760507eaEcbb84', // Admin wallet address (EVM compatible)
            value: amountWei,
            gas: '0x5208',
          }],
        });

        console.log('Payment transaction details:', {
          dogecoinAmount: dogeAmount,
          amountWei: amountWei,
          amountHex: amountWei.toString()
        });

        if (tx) {
          return { success: true, transactionHash: tx };
        }
      }

      return { success: false, error: "Payment transaction failed" };
    } catch (error: any) {
      if (error.code === 4001) {
        return { success: false, error: "Payment was rejected by user" };
      }
      return { success: false, error: error.message || "Payment failed" };
    }
  };

  const createQuestAfterPayment = async (questData: any, transactionHash: string, dogecoinAmount: any) => {
    try {
      // Generate unique quest ID
      const questId = `quest_${Date.now()}`;

      const newQuest = {
        ...questData,
        id: questId,
        reward: 100, // Auto-allocated points
        dogecoinAmount: dogecoinAmount,
        creator: currentUser?.wallet,
        paymentTx: transactionHash,
        submittedBy: currentUser?.wallet,
        status: 'active' as const
      };

      addQuest(newQuest);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to create quest" };
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-header text-dnk-primary mb-4">Connect Wallet Required</h2>
        <p className="text-text-muted mb-8">Please connect your wallet to submit quests.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/quests" className="text-dnk-primary hover:text-dnk-primary-light transition-colors">
            ← Back to Quests
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-dnk-primary mb-2">Submit New Quest</h1>
        <p className="text-text-muted">Create engaging quests to promote your project and build community</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-1">
          <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-6">
            <h2 className="text-xl font-semibold text-dnk-primary mb-6">Quest Details</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-dnk-primary border-b border-dnk-accent/20 pb-2">Project Information</h3>

                <div>
                  <label className="block text-text-light text-sm font-medium mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                    placeholder="e.g., Dustinal Dogs NFT Collection"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-light text-sm font-medium mb-2">
                    Project Website
                  </label>
                  <input
                    type="url"
                    name="projectUrl"
                    value={formData.projectUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                    placeholder="https://yourproject.com"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-dnk-primary border-b border-dnk-accent/20 pb-2">Social Links</h3>

                <div>
                  <label className="block text-text-light text-sm font-medium mb-2">
                    Twitter/X Profile
                  </label>
                  <input
                    type="url"
                    value={formData.socialLinks.twitter}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                    placeholder="https://twitter.com/yourproject"
                  />
                </div>

                <div>
                  <label className="block text-text-light text-sm font-medium mb-2">
                    Discord Server
                  </label>
                  <input
                    type="url"
                    value={formData.socialLinks.discord}
                    onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                    className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                    placeholder="https://discord.gg/yourserver"
                  />
                </div>
              </div>

              {/* Quest Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-dnk-primary border-b border-dnk-accent/20 pb-2">Quest Information</h3>

                <div>
                  <label className="block text-text-light text-sm font-medium mb-2">
                    Quest Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                    placeholder="e.g., Like Our Pinned Posts"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-light text-sm font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                    placeholder="Describe what users need to do to complete this quest..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-light text-sm font-medium mb-2">
                    Category *
                  </label>
                  <CustomDropdown
                    value={formData.category}
                    onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    options={['', 'Novice', 'Adept', 'Master', 'Legendary'] as const}
                    placeholder="Select Category"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-text-light text-sm font-medium mb-2">
                      Reward Type *
                    </label>
                    <CustomDropdown
                      value={formData.rewardType}
                      onChange={(value) => setFormData(prev => ({ ...prev, rewardType: value }))}
                      options={['DRC-20 TOKENS', 'Dunes', 'TAP Protocol tokens', 'DogeOS tokens', 'Whitelist', 'doginals', 'Laika'] as const}
                      required
                    />
                  </div>

                  <div className="bg-dnk-primary/10 border border-dnk-primary/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-dnk-primary">ℹ️</span>
                      <span className="text-dnk-primary font-medium">Auto-Allocated Points</span>
                    </div>
                    <p className="text-text-muted text-sm">
                      All quests automatically receive <strong>100 points</strong> as reward for participants.
                    </p>
                  </div>
                </div>

                {!['Whitelist'].includes(formData.rewardType) && (
                  <div>
                    <label className="block text-text-light text-sm font-medium mb-2">
                      DOGE Reward Amount *
                    </label>
                    <input
                      type="number"
                      name="dogecoinAmount"
                      value={formData.dogecoinAmount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                      placeholder="e.g., 10"
                      min="0.01"
                      step="0.01"
                      required
                    />
                    <p className="text-text-muted text-sm mt-2">
                      ⚠️ This amount will be deducted from your wallet when you create the quest.
                    </p>
                  </div>
                )}

                  {/* Token Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-light text-sm font-medium mb-2">
                        {formData.rewardType === 'Whitelist' ? 'Collection Name *' : 'Token Ticker *'}
                      </label>
                      <input
                        type="text"
                        name="tokenTicker"
                        value={formData.tokenTicker}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                        placeholder={formData.rewardType === 'Whitelist' ? 'e.g., My NFT Collection' : 'e.g., DUNES, TAP, etc.'}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-text-light text-sm font-medium mb-2">
                        {formData.rewardType === 'Whitelist' ? 'Number of winners *' : 'Token Amount *'}
                      </label>
                      <input
                        type="number"
                        name="tokenAmount"
                        value={formData.tokenAmount}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                        placeholder={formData.rewardType === 'Whitelist' ? 'e.g., 50' : 'e.g., 1000'}
                        min={formData.rewardType === 'Whitelist' ? '1' : '0.01'}
                        step={formData.rewardType === 'Whitelist' ? '1' : '0.01'}
                        required
                      />
                    </div>
                  </div>

                  {/* Address requirement for specific token types */}
                  {(['DRC-20 TOKENS', 'Dunes', 'TAP Protocol tokens', 'doginals', 'Laika', 'DogeOS tokens'].includes(formData.rewardType) && formData.rewardType !== 'Whitelist') && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-orange-400 text-xl flex-shrink-0">⚠️</span>
                        <div>
                          <h3 className="text-orange-400 font-medium mb-2">Required: Send Tokens First</h3>
                          <p className="text-orange-300 text-sm mb-3">
                            Before submitting this quest, you must send <strong>{formData.tokenAmount} {formData.tokenTicker}</strong> tokens to the following address:
                          </p>
                          <div className="bg-dnk-surface/50 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-dnk-primary text-sm break-all">
                                {['DRC-20 TOKENS', 'Dunes', 'TAP Protocol tokens', 'doginals'].includes(formData.rewardType) ? 
                                  'DDRZJDBCRVJSX2nWsNoYvvsM3YzFw5Q8GD' :
                                  ['Laika', 'DogeOS tokens'].includes(formData.rewardType) ?
                                  '0xbF82E1ea36e2a7E19F7D014De7760507eaEcbb84' :
                                  'No payment required'
                                }
                              </code>
                              {!['whitelist'].includes(formData.rewardType) && (
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText('0xbF82E1ea36e2a7E19F7D014De7760507eaEcbb84')}
                                  className="bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-3 py-1 rounded text-xs font-medium transition-colors flex-shrink-0"
                                >
                                  Copy
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-orange-300 text-xs">
                            📍 This ensures the tokens are available for distribution to quest participants.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                <div>
                  <label className="block text-text-light text-sm font-medium mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                  />
                </div>

                {/* Quest Tasks Builder */}
                <div className="bg-dnk-secondary/30 rounded-lg p-6 border border-dnk-accent/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-dnk-primary">Quest Tasks</h3>
                    <button
                      type="button"
                      onClick={addTask}
                      className="bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                    >
                      <span>+</span>
                      Add Task
                    </button>
                  </div>

                  <div className="space-y-4">
                    {tasks.map((task, index) => (
                      <div key={task.id} className="bg-dnk-surface/50 rounded-lg p-4 border border-dnk-accent/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-text-light font-medium">Task {index + 1}</h4>
                          {tasks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTask(task.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          {/* Task Description */}
                          <div>
                            <label className="block text-text-light text-sm font-medium mb-2">
                              Task Description *
                            </label>
                            <input
                              type="text"
                              value={task.description}
                              onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                              className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                              placeholder="e.g., Follow our Twitter account"
                              required
                            />
                          </div>

                          {/* Task Type */}
                          <div>
                            <label className="block text-text-light text-sm font-medium mb-2">
                              Task Type
                            </label>
                            <CustomDropdown
                              value={task.type}
                              onChange={(value) => updateTask(task.id, 'type', value)}
                              options={['text', 'twitter', 'discord', 'telegram', 'url', 'image', 'game', 'defi', 'nft'] as const}
                            />
                          </div>

                          {/* Proof Requirement Toggle */}
                          <div className="flex items-center justify-between bg-dnk-secondary/30 rounded-lg p-3">
                            <div>
                              <label className="block text-text-light text-sm font-medium mb-1">
                                Require Proof Submission
                              </label>
                              <p className="text-text-muted text-xs">
                                Toggle if users need to submit proof for this specific task
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={task.proofRequired}
                                onChange={(e) => updateTask(task.id, 'proofRequired', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-dnk-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-dnk-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dnk-primary"></div>
                            </label>
                          </div>

                          {/* Task Type Info */}
                          {task.type === 'twitter' && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                              <p className="text-blue-400 text-xs">
                                🐦 Twitter tasks can include following, liking, retweeting, or posting. Users will need to provide their Twitter username or post URLs for verification.
                              </p>
                            </div>
                          )}

                          {task.type === 'discord' && (
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                              <p className="text-purple-400 text-xs">
                                💬 Discord tasks like joining servers or participating in discussions. Users provide their Discord username for verification.
                              </p>
                            </div>
                          )}

                          {task.type === 'telegram' && (
                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                              <p className="text-cyan-400 text-xs">
                                📱 Telegram tasks like joining channels or groups. Users provide their Telegram username for verification.
                              </p>
                            </div>
                          )}

                          {task.type === 'game' && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                              <p className="text-green-400 text-xs">
                                🎮 Gaming tasks like reaching achievements or completing levels. Users may provide screenshots or game usernames.
                              </p>
                            </div>
                          )}

                          {task.type === 'defi' && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                              <p className="text-yellow-400 text-xs">
                                💰 DeFi tasks like staking, swapping, or providing liquidity. Users may provide transaction hashes or wallet addresses.
                              </p>
                            </div>
                          )}

                          {task.type === 'nft' && (
                            <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3">
                              <p className="text-pink-400 text-xs">
                                🖼️ NFT tasks like minting, trading, or holding specific NFTs. Users may provide collection links or transaction proofs.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-text-muted">
                      <p>No tasks added yet. Click "Add Task" to create your first quest task.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.projectName || !formData.title || !formData.description || 
                      (formData.rewardType !== 'whitelist' && (!formData.dogecoinAmount || !formData.tokenTicker || !formData.tokenAmount))}
                    className="bg-dnk-primary hover:bg-dnk-primary-dark disabled:bg-dnk-secondary disabled:cursor-not-allowed text-dnk-surface px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <span>{isSubmitting ? '⏳' : '✨'}</span>
                    {isSubmitting ? 'Submitting...' : 'Submit Quest'}
                  </button>
                  <button
                    type="button"
                    className="bg-dnk-secondary hover:bg-dnk-secondary/80 text-text-light px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Quest Tips */}
        <div className="space-y-6">
          <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-6">
            <h3 className="text-lg font-medium text-dnk-primary mb-4">Quest Tips</h3>
            <div className="space-y-3 text-sm text-text-muted">
              <div className="flex items-start gap-3">
                <span className="text-dnk-primary">•</span>
                <div>
                  <p className="text-text-light font-medium">Clear Instructions</p>
                  <p>Write step-by-step instructions that are easy to follow</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-dnk-primary">•</span>
                <div>
                  <p className="text-text-light font-medium">Fair Rewards</p>
                  <p>Set appropriate point rewards based on quest difficulty</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-dnk-primary">•</span>
                <div>
                  <p className="text-text-light font-medium">Community Value</p>
                  <p>Ensure your quest provides value to the Doge ecosystem</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;