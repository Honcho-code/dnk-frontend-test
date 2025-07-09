import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { NetworkSwitcher } from '../components/NetworkSwitcher';
import { getCurrentChainId, isDogeOSNetwork } from '../utils/wallet';

export function QuestDetail() {
  const { id } = useParams<{ id: string }>();
  const { 
    quests, 
    completedQuests, 
    currentUser, 
    submitQuest, 
    verifyAndCompleteQuest,
    updateSocialAccounts,
    userSocialAccounts,
    markWhitelistWinner,
    questSubmissions
  } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [proofs, setProofs] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [canRetry, setCanRetry] = useState(true);
  const [needsNetworkSwitch, setNeedsNetworkSwitch] = useState(false);
  const [isOnDogeOS, setIsOnDogeOS] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSteps, setVerifiedSteps] = useState<Set<number>>(new Set());

  const quest = quests.find(q => q.id === id);
  const isCompleted = completedQuests.includes(quest.id);
  const userSubmission = questSubmissions.find(
    s => s.questId === quest.id && s.userWallet === currentUser?.wallet
  );
  const isQuestExpired = quest?.endDate ? new Date(quest.endDate) < new Date() : false;
  const canParticipate = !!currentUser && !isQuestExpired;
  const isWhitelistWinner = quest.rewardType === 'Whitelist' && quest.whitelistWinners?.includes(currentUser?.wallet || '');
  const isAdmin = currentUser?.wallet === quest.creator || currentUser?.wallet === quest.submittedBy;
  const whitelistParticipants = questSubmissions
    .filter(s => s.questId === quest.id && s.status === 'approved')
    .map(s => s.userWallet);

  // Debug logging
  useEffect(() => {
    console.log('Quest Detail Debug:', {
      id,
      quest: quest ? { id: quest.id, title: quest.title } : null,
      currentUser: currentUser ? { wallet: currentUser.wallet } : null,
      isCompleted,
      userSubmission: userSubmission ? userSubmission.id : null
    });
  }, [id, quest, currentUser, isCompleted, userSubmission]);

  // Countdown timer for retry
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(retryCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (retryCountdown === 0 && !canRetry) {
      setCanRetry(true);
      setVerificationError(null);
    }
  }, [retryCountdown, canRetry]);

  useEffect(() => {
    const checkNetwork = async () => {
      if (quest && quest.dogecoinAmount > 0 && currentUser && window.ethereum) {
        try {
          const chainId = await getCurrentChainId();
          const dogeOS = isDogeOSNetwork(chainId);
          setIsOnDogeOS(dogeOS);
          setNeedsNetworkSwitch(!dogeOS);
        } catch (error) {
          console.error('Failed to check network:', error);
          setIsOnDogeOS(false);
          setNeedsNetworkSwitch(true);
        }
      } else {
        setIsOnDogeOS(true);
        setNeedsNetworkSwitch(false);
      }
    };

    checkNetwork();
  }, [quest, currentUser]);

  // Auto-submit when all steps are verified
  useEffect(() => {
    if (quest && 
        quest.steps.length > 0 && 
        verifiedSteps.size === quest.steps.length && 
        verifiedSteps.size > 0 && 
        !isCompleted && 
        !userSubmission && 
        currentUser) {
      // Delay auto-submit slightly to allow UI to update
      const timer = setTimeout(() => {
        handleSubmitQuest();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [verifiedSteps.size, quest?.steps.length, quest?.id, isCompleted, userSubmission, currentUser]);


  const handleNetworkSwitch = async () => {
    // Wait a moment for the network switch to complete
    setTimeout(async () => {
      try {
        const chainId = await getCurrentChainId();
        const dogeOS = isDogeOSNetwork(chainId);
        setIsOnDogeOS(dogeOS);
        setNeedsNetworkSwitch(!dogeOS);

        if (dogeOS) {
          console.log('Successfully switched to DogeOS network!');
        }
      } catch (error) {
        console.error('Failed to check network after switch:', error);
      }
    }, 1500);
  };

  if (!quest) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-header text-dnk-primary mb-4">Quest Not Found</h2>
        <p className="text-text-muted mb-8">This quest has been lost to time.</p>
        <Link
          to="/quests"
          className="inline-block bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-6 py-3 rounded-lg font-medium transition-colors duration-150"
        >
          Return to Quests
        </Link>
      </div>
    );
  }

  const currentStepData = quest.steps[currentStep];

  const handleProofChange = (stepIndex: number, value: string) => {
    setProofs(prev => ({ ...prev, [stepIndex]: value }));
  };

  const handleSubmitQuest = async () => {
    if (!currentUser) return;

    // All quests now use auto-verification
    setIsVerifying(true);
    setVerificationError(null);

    try {
      const result = await verifyAndCompleteQuest(quest.id, proofs);

      if (result.success) {
        alert('🎉 Quest completed successfully! You have earned ' + quest.reward + ' points.');
      } else {
        setVerificationError(result.error || 'Verification failed');
        if (result.retryAfter) {
          setRetryCountdown(result.retryAfter);
          setCanRetry(false);
        }
      }
    } catch (error) {
      console.error('Error verifying quest:', error);
      setVerificationError('Network error. Please try again.');
      setRetryCountdown(20);
      setCanRetry(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyTask = async () => {
    const step = quest.steps[currentStep];

    // Check if proof is required and provided
    if (step.proofRequired && (!proofs[currentStep] || proofs[currentStep].trim() === '')) {
      setVerificationError('❌ Task not completed, try again');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const userProof = proofs[currentStep]?.trim() || '';
      let verificationPassed = false;

      // Check if this is a retry attempt
      const attemptKey = `${quest.id}_${currentStep}_${currentUser?.wallet}`;
      const { verificationAttempts } = useStore.getState();
      const attempts = verificationAttempts[attemptKey] || 0;

      // For all tasks (including those that don't require proof), fail on first attempt
      if (attempts === 0) {
        // Always fail on first attempt
        verificationPassed = false;
        setVerificationError('❌ Task not completed, try again');

        // Increment attempt counter
        useStore.setState(state => ({
          verificationAttempts: {
            ...state.verificationAttempts,
            [attemptKey]: 1
          }
        }));
      } else {
        // On retry attempts, proceed with actual verification logic
        // Get user's linked social accounts
        const { userSocialAccounts } = useStore.getState();
        const userAccounts = userSocialAccounts[currentUser?.wallet || ''] || {};

        // Early validation: Check if user has the SPECIFIC social account linked for social media tasks
        if (['twitter', 'discord', 'telegram'].includes(step.type)) {
          let requiredAccount = null;

          if (step.type === 'twitter') {
            requiredAccount = userAccounts.twitter;
          } else if (step.type === 'discord') {
            requiredAccount = userAccounts.discord;
          } else if (step.type === 'telegram') {
            requiredAccount = userAccounts.telegram;
          }

          if (!requiredAccount) {
            verificationPassed = false;
            setVerificationError('❌ Task not completed, try again');
            setRetryCountdown(20);
            setCanRetry(false);
            setIsVerifying(false);
            return;
          }
        }

        // Validate social media links (account already validated above)
        if (step.type === 'twitter') {
          const linkedTwitter = userAccounts.twitter?.replace('@', '').toLowerCase();

          if (step.proofRequired) {
            if (userProof && userProof.length > 0) {
              if (step.verificationData?.action === 'follow') {
                // For follow tasks, check if username is provided and matches linked account
                const cleanUsername = userProof.replace('@', '').toLowerCase();
                verificationPassed = cleanUsername === linkedTwitter;

                if (!verificationPassed) {
                  setVerificationError('❌ Task not completed, try again');
                }
              } else {
                // For tweet/retweet/like tasks, check if it's a valid Twitter URL with user's linked account
                const twitterUrlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/([A-Za-z0-9_]+)/;
                const match = userProof.match(twitterUrlPattern);

                if (match) {
                  const usernameInUrl = match[3].toLowerCase();
                  verificationPassed = usernameInUrl === linkedTwitter;

                  if (!verificationPassed) {
                    setVerificationError('❌ Task not completed, try again');
                  }
                } else {
                  verificationPassed = false;
                  setVerificationError('❌ Task not completed, try again');
                }
              }
            } else {
              verificationPassed = false;
              setVerificationError('❌ Task not completed, try again');
            }
          } else {
            // No proof required, but account must be linked (already validated above)
            // Since account is already validated above, this task passes
            verificationPassed = true;
          }
        } else if (step.type === 'discord') {
          const linkedDiscord = userAccounts.discord?.replace('@', '').toLowerCase();

          if (step.proofRequired) {
            if (userProof && userProof.length > 0) {
              // For Discord, check if the submitted proof contains the linked Discord account
              const submittedProofLower = userProof.toLowerCase();
              const linkedDiscordClean = linkedDiscord.replace('@', '').toLowerCase();

              // More robust Discord username matching
              const discordUsernamePattern = new RegExp(`\\b${linkedDiscordClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
              verificationPassed = discordUsernamePattern.test(submittedProofLower) || submittedProofLower.includes(linkedDiscordClean);

              if (!verificationPassed) {
                setVerificationError('❌ Task not completed, try again');
              }
            } else {
              verificationPassed = false;
              setVerificationError('❌ Task not completed, try again');
            }
          } else {
            // No proof required, but account must be linked (already validated above)
            // Since account is already validated above, this task passes
            verificationPassed = true;
          }
        } else if (step.type === 'telegram') {
          const linkedTelegram = userAccounts.telegram?.replace('@', '').toLowerCase();

          if (step.proofRequired) {
            if (userProof && userProof.length > 0) {
              // For Telegram, check if the submitted proof contains the linked Telegram account
              const submittedProofLower = userProof.toLowerCase();
              const linkedTelegramClean = linkedTelegram.replace('@', '').toLowerCase();

              // Check for telegram URL patterns or username mentions
              const telegramUrlPattern = /(?:https?:\/\/)?(t\.me|telegram\.me)\/([A-Za-z0-9_]+)/i;
              const telegramMatch = userProof.match(telegramUrlPattern);

              if (telegramMatch) {
                const usernameInUrl = telegramMatch[2].toLowerCase();
                verificationPassed = usernameInUrl === linkedTelegramClean;

                if (!verificationPassed) {
                  setVerificationError('❌ Task not completed, try again');
                }
              } else {
                // If not a URL, check if username is mentioned in the proof
                const usernamePattern = new RegExp(`@?${linkedTelegramClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                verificationPassed = usernamePattern.test(submittedProofLower);

                if (!verificationPassed) {
                  setVerificationError('❌ Task not completed, try again');
                }
              }
            } else {
              verificationPassed = false;
              setVerificationError('❌ Task not completed, try again');
            }
          } else {
            // No proof required, but account must be linked (already validated above)
            // Since account is already validated above, this task passes
            verificationPassed = true;
          }
        } else {
          // For other task types (like URL visits), check if proof is required
          if (!step.proofRequired) {
            // No proof required, automatically pass verification on retry
            verificationPassed = true;
          } else if (userProof && userProof.length > 0) {
            // For URL tasks, validate the URL format
            if (step.type === 'url') {
              try {
                new URL(userProof);
                verificationPassed = true;
              } catch {
                verificationPassed = false;
                setVerificationError('❌ Task not completed, try again');
              }
            } else {
              // For other proof-required tasks, just check if proof is provided
              verificationPassed = true;
            }
          } else {
            verificationPassed = false;
            setVerificationError('❌ Task not completed, try again');
          }
        }
      }

      if (verificationPassed) {
        // Mark step as verified
        setVerifiedSteps(prev => new Set([...prev, currentStep]));
        setVerificationError(null);
      } else {
        // Show verification failed with 20 second countdown
        setRetryCountdown(20);
        setCanRetry(false);
      }
    } catch (error) {
      setVerificationError('❌ Task not completed, try again');
      setRetryCountdown(20);
      setCanRetry(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteStep = () => {
    if (currentStep < quest.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const canSubmitQuest = () => {
    // Check if all steps are verified
    for (let i = 0; i < quest.steps.length; i++) {
      if (!verifiedSteps.has(i)) {
        return false;
      }
    }
    return true;
  };

  return (
    <div>
      {/* Quest Header */}
      <div className="bg-dnk-secondary/30 rounded-lg p-4 md:p-8 mb-6 md:mb-8">
        <div className="mb-4 md:mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
              <span className="inline-block px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm rounded-full bg-dnk-primary/20 text-dnk-primary-light">
                {quest.category}
              </span>
              {isCompleted && (
                <span className="inline-block px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm rounded-full bg-green-500/20 text-green-400">
                  Completed
                </span>
              )}
              {userSubmission && (
                <span className="inline-block px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm rounded-full bg-yellow-500/20 text-yellow-400">
                  Under Review
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-3xl font-header text-dnk-primary mb-3 md:mb-4 leading-tight">{quest.title}</h1>
            <p className="text-text-muted text-sm md:text-lg mb-4 md:mb-6 leading-relaxed">{quest.description}</p>
            <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-6">
              <div className="min-w-0">
                <span className="text-dnk-primary-light font-medium text-sm md:text-lg block truncate">{quest.reward} Points</span>
                <p className="text-text-muted text-xs md:text-sm">XP Reward</p>
              </div>
              <div className="min-w-0">
                <span className="text-orange-400 font-medium text-sm md:text-lg block truncate">{quest.dogecoinAmount} DOGE</span>
                <p className="text-text-muted text-xs md:text-sm">DOGE Prize</p>
              </div>
              {quest.tokenTicker && quest.tokenAmount && (
                <div className="min-w-0">
                  <span className="text-green-400 font-medium text-sm md:text-lg block truncate">{quest.tokenAmount} {quest.tokenTicker}</span>
                  <p className="text-text-muted text-xs md:text-sm">Token Reward</p>
                </div>
              )}
              <div className="min-w-0">
                <span className="text-text-light font-medium text-sm md:text-lg block">{quest.steps.length}</span>
                <p className="text-text-muted text-xs md:text-sm">Tasks</p>
              </div>
              <div className="min-w-0 col-span-2 md:col-span-1">
                <span className="text-text-light font-medium text-sm md:text-lg block truncate">{quest.rewardType}</span>
                <p className="text-text-muted text-xs md:text-sm">Reward Type</p>
              </div>
              {quest.endDate && (
                <div className="min-w-0 col-span-2 md:col-span-1">
                  <span className="text-red-400 font-medium text-sm md:text-lg block">
                    {new Date(quest.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: window.innerWidth < 768 ? '2-digit' : 'numeric'
                    })}
                  </span>
                  <p className="text-text-muted text-xs md:text-sm">Quest Ends</p>
                </div>
              )}
            </div>

            {/* Quest End Time Warning */}
            {quest.endDate && (
              <div className={`mt-4 md:mt-6 rounded-lg p-3 md:p-4 ${
                isQuestExpired 
                  ? 'bg-gray-500/10 border border-gray-500/20' 
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                <div className="flex items-start gap-2 md:gap-3">
                  <span className={`text-lg md:text-xl flex-shrink-0 ${
                    isQuestExpired ? 'text-gray-400' : 'text-red-400'
                  }`}>
                    {isQuestExpired ? '⛔' : '⏰'}
                  </span>
                  <div className="min-w-0">
                    <h3 className={`font-medium mb-2 text-sm md:text-base ${
                      isQuestExpired ? 'text-gray-400' : 'text-red-400'
                    }`}>
                      {isQuestExpired ? 'Quest Expired' : 'Quest Expiry'}
                    </h3>
                    <p className={`text-xs md:text-sm leading-relaxed ${
                      isQuestExpired ? 'text-gray-300' : 'text-red-300'
                    }`}>
                      This quest {isQuestExpired ? 'ended' : 'will end'} on <strong>{new Date(quest.endDate).toLocaleDateString('en-US', {
                        weekday: window.innerWidth < 768 ? 'short' : 'long',
                        year: 'numeric',
                        month: window.innerWidth < 768 ? 'short' : 'long',
                        day: 'numeric'
                      })}</strong> at <strong>{new Date(quest.endDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: window.innerWidth < 768 ? 'short' : 'short'
                      })}</strong>.
                      {(() => {
                        if (isQuestExpired) {
                          return ' This quest is no longer accepting new participants or task submissions.';
                        }
                        
                        const now = new Date();
                        const endDate = new Date(quest.endDate);
                        const timeDiff = endDate.getTime() - now.getTime();
                        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

                        if (daysLeft > 1) {
                          return ` You have ${daysLeft} days remaining to complete this quest.`;
                        } else if (daysLeft === 1) {
                          return ' Only 1 day remaining!';
                        } else if (daysLeft === 0) {
                          const hoursLeft = Math.ceil(timeDiff / (1000 * 3600));
                          return hoursLeft > 0 ? ` Only ${hoursLeft} hours remaining!` : ' Quest expires very soon!';
                        } else {
                          return ' This quest has expired.';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Prize Distribution Info */}
            {(quest.dogecoinAmount > 0 || (quest.tokenTicker && quest.tokenAmount)) && (
              <div className="mt-4 md:mt-6 bg-gradient-to-r from-orange-500/10 to-green-500/10 border border-orange-500/20 rounded-lg p-3 md:p-4">
                <div className="flex items-start gap-2 md:gap-3">
                  <span className="text-orange-400 text-lg md:text-xl flex-shrink-0">🎁</span>
                  <div className="min-w-0">
                    <h3 className="text-orange-400 font-medium mb-2 text-sm md:text-base">Reward Distribution</h3>
                    <div className="space-y-2">
                      {quest.dogecoinAmount > 0 && (
                        <p className="text-orange-300 text-xs md:text-sm leading-relaxed">
                          <strong>{quest.dogecoinAmount} DOGE</strong> will be distributed among all participants who complete this quest.
                        </p>
                      )}
                      {quest.tokenTicker && quest.tokenAmount && (
                        <p className="text-green-300 text-xs md:text-sm leading-relaxed">
                          <strong>{quest.tokenAmount} {quest.tokenTicker}</strong> tokens will also be distributed among all participants.
                        </p>
                      )}
                      <p className="text-yellow-300 text-xs md:text-sm leading-relaxed">
                        💡 The more participants, the smaller each individual reward, but everyone who completes the quest gets their share!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Project Social Links */}
            {(quest.socialLinks?.twitter || quest.socialLinks?.discord || quest.socialLinks?.website || quest.projectUrl) && (
              <div className="mt-4 md:mt-6 bg-dnk-surface/30 rounded-lg p-3 md:p-4 border border-dnk-accent/20">
                <h3 className="text-xs md:text-sm font-medium text-dnk-primary mb-3">Project Links</h3>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {quest.projectUrl && (
                    <a
                      href={quest.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3 md:py-2 bg-dnk-primary/20 hover:bg-dnk-primary/30 text-dnk-primary-light rounded-lg text-xs md:text-sm font-medium transition-colors"
                    >
                      🌐 Website
                    </a>
                  )}
                  {quest.socialLinks?.website && quest.socialLinks.website !== quest.projectUrl && (
                    <a
                      href={quest.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3 md:py-2 bg-dnk-primary/20 hover:bg-dnk-primary/30 text-dnk-primary-light rounded-lg text-xs md:text-sm font-medium transition-colors"
                    >
                      🌐 Website
                    </a>
                  )}
                  {quest.socialLinks?.twitter && (
                    <a
                      href={quest.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3 md:py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs md:text-sm font-medium transition-colors"
                    >
                      🐦 <span className="hidden sm:inline">Twitter/X</span><span className="sm:hidden">X</span>
                    </a>
                  )}
                  {quest.socialLinks?.discord && (
                    <a
                      href={quest.socialLinks.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3 md:py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs md:text-sm font-medium transition-colors"
                    >
                      💬 Discord
                    </a>
                  )}
                  {quest.socialLinks?.telegram && (
                    <a
                      href={quest.socialLinks.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3 md:py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs md:text-sm font-medium transition-colors"
                    >
                      ✈️ Telegram
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCompleted ? (
        <div className="text-center py-8 md:py-12 bg-green-500/10 rounded-lg border border-green-500/20 px-4">
          <h2 className="text-xl md:text-2xl font-header text-green-400 mb-3 md:mb-4">Quest Completed!</h2>
          <p className="text-text-muted mb-4 md:mb-6 text-sm md:text-base">You have successfully completed this quest and earned {quest.reward} points.</p>

          {/* Whitelist Winner Status */}
          {quest.rewardType === 'whitelist' && currentUser && (
            <div className="mb-4 md:mb-6">
              {quest.whitelistWinners?.includes(currentUser.wallet) ? (
                <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4 md:p-6">
                  <h3 className="text-green-400 font-medium text-lg md:text-xl mb-2">🎉 Congratulations!</h3>
                  <p className="text-green-300 text-sm md:text-base">
                    You have been selected as a whitelist winner for this quest! 
                    Check the project's official channels for further instructions.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4 md:p-6">
                  <h3 className="text-yellow-400 font-medium text-lg md:text-xl mb-2">⏳ Results Pending</h3>
                  <p className="text-yellow-300 text-sm md:text-base">
                    Quest completed! Whitelist winners will be announced by the project team. 
                    Stay tuned for updates.
                  </p>
                </div>
              )}
            </div>
          )}

          <Link
            to="/quests"
            className="inline-block bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-colors duration-150 text-sm md:text-base"
          >
            Find More Quests
          </Link>
        </div>
      ) : isQuestExpired ? (
        <div className="text-center py-8 md:py-12 bg-gray-500/10 rounded-lg border border-gray-500/20 px-4">
          <h2 className="text-xl md:text-2xl font-header text-gray-400 mb-3 md:mb-4">Quest Has Expired</h2>
          <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
            This quest ended on {new Date(quest.endDate!).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} and is no longer accepting new participants or task submissions.
          </p>
          <Link
            to="/quests"
            className="inline-block bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-colors duration-150 text-sm md:text-base"
          >
            Find Active Quests
          </Link>
        </div>
      ) : !canParticipate ? (
        <div className="text-center py-8 md:py-12 bg-dnk-secondary/30 rounded-lg border border-dnk-accent/20 px-4">
          <h2 className="text-xl md:text-2xl font-header text-dnk-primary mb-3 md:mb-4">Connect Wallet to Participate</h2>
          <p className="text-text-muted mb-4 md:mb-6 text-sm md:text-base">Connect your wallet to start completing this quest and earn rewards.</p>
          <div className="text-left max-w-2xl mx-auto bg-dnk-secondary/30 rounded-lg p-4 md:p-6">
            <h3 className="text-base md:text-lg font-medium text-dnk-primary mb-3 md:mb-4">Quest Tasks Preview:</h3>
            {quest.steps.map((step, index) => (
              <div key={index} className="mb-3 md:mb-4 opacity-75">
                <p className="text-text-light font-medium mb-2 text-sm md:text-base">Task {index + 1}: {step.step}</p>
                <div className="bg-dnk-surface/50 p-2 md:p-3 rounded border border-dnk-accent/20">
                  <p className="text-text-muted text-xs md:text-sm">
                    {step.type === 'twitter' && 'Twitter task'}
                    {step.type === 'discord' && 'Discord task'}
                    {step.type === 'url' && 'URL submission required'}
                    {step.type === 'image' && 'Image upload required'}
                    {step.type === 'text' && 'Text submission required'}
                    {step.type === 'checkbox' && 'Confirmation required'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {/* Progress */}
          <div className="bg-dnk-secondary/30 rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-header text-dnk-primary">Quest Progress</h2>
              <span className="text-text-muted text-sm md:text-base">
                {currentStep + 1} of {quest.steps.length}
              </span>
            </div>
            <div className="relative">
              <div className="h-2 bg-dnk-secondary rounded-full">
                <div
                  className="h-2 bg-dnk-primary rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / quest.steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quest Steps */}
          <div className="space-y-4 md:space-y-6">
            {quest.steps.map((step, index) => (
              <div
                key={index}
                className={`bg-dnk-secondary/30 rounded-lg p-4 md:p-6 border transition-all duration-300 ${
                  index === currentStep
                    ? 'border-dnk-primary/50 bg-dnk-primary/5'
                    : index < currentStep
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-dnk-accent/20'
                }`}
              >
                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className={`flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-medium text-sm md:text-base ${
                    index < currentStep
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-dnk-primary text-dnk-surface'
                      : 'bg-dnk-secondary text-text-muted'
                  }`}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-medium text-dnk-primary mb-2 leading-tight">
                      {/* Make URLs and website names clickable in step text */}
                      {step.step.split(' ').map((word, wordIndex) => {
                        // Check if word is a URL
                        const urlPattern = /^https?:\/\/[^\s]+/;
                        if (urlPattern.test(word)) {
                          return (
                            <a
                              key={wordIndex}
                              href={word}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-dnk-primary hover:text-dnk-primary-light underline cursor-pointer"
                            >
                              {word}
                            </a>
                          );
                        }

                        // Check if word is a website name (ends with common TLDs)
                        const websitePattern = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/;
                        if (websitePattern.test(word)) {
                          const url = word.startsWith('http') ? word : `https://${word}`;
                          return (
                            <a
                              key={wordIndex}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-dnk-primary hover:text-dnk-primary-light underline cursor-pointer"
                            >
                              {word}
                            </a>
                          );
                        }

                        return <span key={wordIndex}>{word}</span>;
                      }).reduce((acc, curr, index) => {
                        if (index === 0) return [curr];
                        return [...acc, ' ', curr];
                      }, [])}
                    </h3>

                    {step.type === 'url' && step.url && (
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium transition-colors duration-150 mb-3 md:mb-4 text-sm md:text-base"
                      >
                        Visit Link →
                      </a>
                    )}

                    {step.type === 'link' && step.url && (
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-dnk-primary hover:bg-dnk-primary-dark text-dnk-surface px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium transition-colors duration-150 mb-3 md:mb-4 text-sm md:text-base"
                      >
                        Go to {step.step} →
                      </a>
                    )}

                    {step.type === 'twitter' && step.verificationData?.postUrl && (
                      <a
                        href={step.verificationData.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium transition-colors duration-150 mb-3 md:mb-4 text-sm md:text-base"
                      >
                        Go to Twitter Post →
                      </a>
                    )}

                    {/* Show proof submission section for tasks that require it */}
                    {step.proofRequired && (
                      <div className="mt-3 md:mt-4 bg-dnk-surface/30 rounded-lg p-3 md:p-4 border border-dnk-accent/20">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-orange-400 text-sm md:text-base">📝</span>
                          <label className="block text-text-light text-xs md:text-sm font-medium">
                            Proof Required for this Task
                          </label>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                          {step.type === 'twitter' ? (
                            <div>
                              <label className="block text-text-muted text-xs mb-2">
                                {step.verificationData?.action === 'follow' ? 
                                  "Your Twitter Username" : 
                                  "Twitter/X Post URL"
                                }
                              </label>
                              <input
                                type="text"
                                value={proofs[index] || ''}
                                onChange={(e) => handleProofChange(index, e.target.value)}
                                disabled={isQuestExpired}
                                className="w-full px-3 py-2 md:px-4 md:py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder={step.verificationData?.action === 'follow' ? 
                                  "Enter your linked Twitter username (e.g., @username)" : 
                                  "Enter the Twitter/X post URL from your linked account"
                                }
                              />
                            </div>
                          ) : step.type === 'discord' ? (
                            <div>
                              <label className="block text-text-muted text-xs mb-2">
                                Your Discord Username
                              </label>
                              <input
                                type="text"
                                value={proofs[index] || ''}
                                onChange={(e) => handleProofChange(index, e.target.value)}
                                disabled={isQuestExpired}
                                className="w-full px-3 py-2 md:px-4 md:py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Enter your linked Discord username (e.g., username#1234)"
                              />
                            </div>
                          ) : step.type === 'telegram' ? (
                            <div>
                              <label className="block text-text-muted text-xs mb-2">
                                Your Telegram Username
                              </label>
                              <input
                                type="text"
                                value={proofs[index] || ''}
                                onChange={(e) => handleProofChange(index, e.target.value)}
                                disabled={isQuestExpired}
                                className="w-full px-3 py-2 md:px-4 md:py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Enter your linked Telegram username (e.g., @username)"
                              />
                            </div>
                          ) : step.type === 'image' ? (
                            <div>
                              <label className="block text-text-muted text-xs mb-2">
                                Image Proof URL
                              </label>
                              <input
                                type="url"
                                value={proofs[index] || ''}
                                onChange={(e) => handleProofChange(index, e.target.value)}
                                disabled={isQuestExpired}
                                className="w-full px-3 py-2 md:px-4 md:py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Upload your screenshot/image to a hosting service and paste the URL here"
                              />
                              <p className="text-xs text-text-muted mt-1">
                                💡 Upload to imgur.com, postimg.org, or similar service
                              </p>
                            </div>
                          ) : step.type === 'url' ? (
                            <div>
                              <label className="block text-text-muted text-xs mb-2">
                                Website/Link URL
                              </label>
                              <input
                                type="url"
                                value={proofs[index] || ''}
                                onChange={(e) => handleProofChange(index, e.target.value)}
                                disabled={isQuestExpired}
                                className="w-full px-3 py-2 md:px-4 md:py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Enter the relevant URL (e.g., https://example.com)"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-text-muted text-xs mb-2">
                                Proof Description/Link
                              </label>
                              <textarea
                                value={proofs[index] || ''}
                                onChange={(e) => handleProofChange(index, e.target.value)}
                                disabled={isQuestExpired}
                                className="w-full px-3 py-2 md:px-4 md:py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                rows={3}
                                placeholder="Provide detailed proof of completion (descriptions, links, etc.)"
                              />
                            </div>
                          )}



                          {(step.type === 'twitter' || step.type === 'discord' || step.type === 'telegram') && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
<div className="flex items-start gap-2">
                                <span className="text-yellow-400">⚠️</span>
                                <div>
                                  <p className="text-xs text-yellow-400 font-medium">Account Linking Required</p>
                                  <p className="text-xs text-yellow-300 mt-1">
                                    Make sure your {step.type === 'twitter' ? 'Twitter/X' : step.type === 'discord' ? 'Discord' : 'Telegram'} account is linked in your{' '}
                                    <Link to="/profile" className="underline hover:text-yellow-200">
                                      Profile page
                                    </Link>{' '}
                                    before submitting this proof.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                                        {/* Show message for tasks that don't require proof */}
                    {!step.proofRequired && index === currentStep && (
                      <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">✅</span>
                          <p className="text-xs text-green-400">
                            No proof required - this task will be marked complete automatically
                          </p>                        </div>
                      </div>
                    )}

                    {index === currentStep && !isQuestExpired && (
                      <div className="mt-4 space-y-3">
                        {verificationError && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <p className="text-red-400 text-sm">{verificationError}</p>
                            {retryCountdown > 0 && (
                              <p className="text-red-300 text-xs mt-1">
                                Try again in {retryCountdown} seconds
                              </p>
                            )}
                          </div>
                        )}

                        {!verifiedSteps.has(currentStep) ? (
                          <button
                            onClick={handleVerifyTask}
                            disabled={isVerifying || !canRetry || isQuestExpired}
                            className="bg-dnk-primary hover:bg-dnk-primary-dark disabled:bg-dnk-secondary disabled:cursor-not-allowed text-dnk-surface px-4 py-2 md:px-6 md:py-2 rounded-lg font-medium transition-colors duration-150 flex items-center gap-1 md:gap-2 text-sm md:text-base"
                          >
                            <span>
                              {isVerifying ? '🔍' : !canRetry ? '⏰' : '✅'}
                            </span>
                            {isVerifying 
                              ? 'Verifying...' 
                              : !canRetry 
                              ? `Verify (${retryCountdown}s)`
                              : 'Verify'
                            }
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                              <p className="text-green-400 text-sm">✅ Task verified successfully!</p>
                            </div>
                            {index < quest.steps.length - 1 ? (
                              <button
                                onClick={handleCompleteStep}
                                disabled={isQuestExpired}
                                className="bg-dnk-primary hover:bg-dnk-primary-dark disabled:bg-dnk-secondary disabled:cursor-not-allowed text-dnk-surface px-4 py-2 md:px-6 md:py-2 rounded-lg font-medium transition-colors duration-150 text-sm md:text-base"
                              >
                                Next Task →
                              </button>
                            ) : (
                              <div className="bg-dnk-primary/10 border border-dnk-primary/20 rounded-lg p-3 mt-2">
                                <p className="text-dnk-primary text-sm">🎉 All tasks completed! Submitting quest...</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {index === currentStep && isQuestExpired && (
                      <div className="mt-4">
                        <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
                          <p className="text-gray-400 text-sm">⛔ Quest has expired - no further actions available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}