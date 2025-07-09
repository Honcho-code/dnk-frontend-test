export type QuestStep = {
  step: string;
  type: 'url' | 'link' | 'text' | 'image' | 'checkbox' | 'twitter' | 'discord';
  proofRequired: boolean;
  url?: string;
  autoVerify?: boolean;
  verificationData?: {
    platform?: 'twitter' | 'discord';
    action?: 'follow' | 'tweet' | 'retweet' | 'join_server';
    targetUser?: string;
    serverId?: string;
  };
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  category: 'Novice' | 'Adept' | 'Master' | 'Legendary';
  rewardType: 'DRC-20 TOKENS' | 'Dunes' | 'TAP Protocol tokens' | 'DogeOS tokens' | 'Whitelist' | 'doginals' | 'Laika';
  reward: number;
  dogecoinAmount?: number;
  tokenTicker?: string;
  tokenAmount?: number;
  steps: QuestStep[];
  projectName?: string;
  projectUrl?: string;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  creator?: string;
  paymentTx?: string;
  submittedBy?: string;
  status?: 'active' | 'completed' | 'paused';
  deadline?: string;
  endDate?: string;
  whitelistWinners?: string[];
};

export const demoQuests: Quest[] = [
  {
    id: "quest001",
    title: "The First Enchantment",
    description: "Begin your magical journey by mastering the fundamental arts. Complete the ritual and prove your worth to the ancient ones.",
    category: "Novice",
    rewardType: "DRC-20 TOKENS",
    reward: 1000,
    dogecoinAmount: 50,
    status: "active",
    steps: [
      {
        step: "Join the Wizards' Council Discord",
        type: "discord",
        url: "https://discord.gg/wizards",
        proofRequired: true,
        autoVerify: true,
        verificationData: {
          platform: "discord",
          action: "join_server",
          serverId: "wizards_council_123"
        }
      },
      {
        step: "Follow us on X (Twitter)",
        type: "twitter",
        url: "https://x.com/dnkquests",
        proofRequired: true,
        autoVerify: true,
        verificationData: {
          platform: "twitter",
          action: "follow",
          targetUser: "dnkquests"
        }
      }
    ],
    endDate: "2025-02-15T23:59:59Z",
  },
  {
    id: "quest002",
    title: "Artifact of Power",
    description: "Seek out the legendary Artifact of Power. Complete mystical trials and prove your mastery of the arcane arts.",
    category: "Adept",
    rewardType: "Dunes",
    reward: 500,
    dogecoinAmount: 25,
    tokenTicker: 'TAP',
    tokenAmount: 500,
    status: "active",
    steps: [
      {
        step: "Retweet our announcement",
        type: "twitter",
        proofRequired: true,
        autoVerify: true,
        verificationData: {
          platform: "twitter",
          action: "retweet"
        }
      },
      {
        step: "Share your magic ritual screenshot",
        type: "image",
        proofRequired: true
      }
    ],
    endDate: "2025-02-20T23:59:59Z",
  },
  {
    id: "quest003",
    title: "The Grand Ritual",
    description: "Participate in the grand ritual to unlock the secrets of the eternal grimoire. Your magical prowess will echo through the ages.",
    category: "Master",
    rewardType: "doginals",
    reward: 1000,
    dogecoinAmount: 100,
    tokenTicker: 'DRC',
    tokenAmount: 2000,
    status: "active",
    steps: [
      {
        step: "Prepare the ritual circle",
        type: "image",
        proofRequired: true
      },
      {
        step: "Channel the ancient energies",
        type: "url",
        proofRequired: true
      }
    ],
    endDate: "2025-03-01T23:59:59Z",
  }
];