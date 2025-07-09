import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { type Quest } from '../data/quests';

const categories = ["All Spells", "Novice", "Adept", "Master", "Legendary"] as const;
const rewardTypes = ["All Rewards", "DRC-20 TOKENS", "Dunes", "TAP Protocol tokens", "DogeOS tokens", "Whitelist", "doginals", "Laika"] as const;

type Category = (typeof categories)[number];
type RewardType = (typeof rewardTypes)[number];

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

export function Quests() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("All Spells");
  const [selectedRewardType, setSelectedRewardType] = useState<RewardType>("All Rewards");
  const [searchQuery, setSearchQuery] = useState("");
  const { quests, completedQuests } = useStore();

  const filteredQuests = quests.filter(quest => {
    if (selectedCategory !== "All Spells" && quest.category !== selectedCategory) return false;
    if (selectedRewardType !== "All Rewards" && quest.rewardType !== selectedRewardType) return false;
    if (searchQuery && !quest.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-header text-dnk-primary mb-4">Available Quests</h1>
        <p className="text-text-muted">
          Browse and complete quests to earn points and climb the leaderboard. Each task you complete brings you closer to the top rankings.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-dnk-secondary/30 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Status Filter */}
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

          {/* Search */}
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Search available quests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dnk-surface border border-dnk-accent/20 rounded-lg px-3 py-2 md:px-4 md:py-2 text-text-light text-sm md:text-base focus:outline-none focus:border-dnk-primary"
            />
          </div>
        </div>
      </div>

      {/* Quests Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredQuests.map((quest) => (
          <QuestCard 
            key={quest.id} 
            quest={quest} 
            isCompleted={completedQuests.includes(quest.id)}
          />
        ))}
      </div>
    </div>
  );
}

function QuestCard({ quest, isCompleted }: { quest: Quest; isCompleted: boolean }) {
  return (
    <Link
      to={`/quest/${quest.id}`}
      className={`block bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 hover:border-dnk-accent/40 overflow-hidden transition-all duration-150 hover:transform hover:scale-[1.02] ${
        isCompleted ? 'opacity-75' : ''
      }`}
    >
      <div className="p-4 bg-dnk-primary/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="inline-block px-3 py-1 text-sm rounded-full bg-dnk-primary/20 text-dnk-primary-light">
            {quest.category}
          </span>
          {isCompleted && (
            <span className="inline-block px-3 py-1 text-sm rounded-full bg-green-500/20 text-green-400">
              Completed
            </span>
          )}
        </div>
      </div>
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-medium text-dnk-primary">{quest.title}</h3>
        <p className="text-text-muted">{quest.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <span className="text-dnk-primary-light font-medium">{quest.dogecoinAmount} DOGE</span>
            <span className="text-orange-400 font-medium text-sm">+{quest.rewardType}</span>
          </div>
          <span className="text-text-muted">
            {quest.steps.length} tasks
          </span>
        </div>
      </div>
    </Link>
  );
}