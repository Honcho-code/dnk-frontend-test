import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

function EditQuest() {
  const navigate = useNavigate();
  const { questId } = useParams<{ questId: string }>();
  const { quests, updateQuest, currentUser } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quest, setQuest] = useState<Quest | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Novice',
    rewardType: 'DRC-20 TOKENS',
    dogecoinAmount: '',
    tokenTicker: '',
    tokenAmount: '',
    projectName: '',
    projectUrl: '',
    deadline: '',
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

  useEffect(() => {
    if (questId) {
      const foundQuest = quests.find(q => q.id === questId);
      if (foundQuest) {
        setQuest(foundQuest);
        setFormData({
          title: foundQuest.title,
          description: foundQuest.description,
          category: foundQuest.category,
          rewardType: foundQuest.rewardType,
          dogecoinAmount: foundQuest.dogecoinAmount.toString(),
          tokenTicker: foundQuest.tokenTicker || '',
          tokenAmount: foundQuest.tokenAmount?.toString() || '',
          projectName: foundQuest.projectName || '',
          projectUrl: foundQuest.projectUrl || '',
          deadline: foundQuest.deadline || '',
          socialLinks: foundQuest.socialLinks || {
            twitter: '',
            discord: '',
            website: ''
          }
        });

        if (foundQuest.steps) {
          setTasks(foundQuest.steps.map((step, index) => ({
            id: Date.now() + index,
            description: step.step,
            type: step.type || 'text',
            proofRequired: step.proofRequired || false
          })));
        }
      }
    }
  }, [questId, quests]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    if (!quest) return;

    setIsSubmitting(true);

    try {
      const steps = tasks
        .filter(task => task.description.trim())
        .map((task) => ({
          step: task.description.trim(),
          type: task.type as any,
          proofRequired: task.proofRequired
        }));

      const updatedQuest: Quest = {
        ...quest,
        title: formData.title,
        description: formData.description,
        category: formData.category as any,
        rewardType: formData.rewardType as any,
        dogecoinAmount: parseFloat(formData.dogecoinAmount),
        tokenTicker: formData.tokenTicker,
        tokenAmount: formData.tokenAmount ? parseFloat(formData.tokenAmount) : undefined,
        projectName: formData.projectName,
        projectUrl: formData.projectUrl,
        deadline: formData.deadline,
        socialLinks: formData.socialLinks,
        steps
      };

      await updateQuest(quest.id, updatedQuest);

      alert('Quest updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating quest:', error);
      alert('Failed to update quest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-header text-dnk-primary mb-4">Connect Wallet Required</h2>
        <p className="text-text-muted mb-8">Please connect your wallet to edit quests.</p>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-header text-dnk-primary mb-4">Quest Not Found</h2>
        <p className="text-text-muted mb-8">The quest you're trying to edit doesn't exist.</p>
        <Link to="/dashboard" className="text-dnk-primary hover:text-dnk-primary-light">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/dashboard" className="text-dnk-primary hover:text-dnk-primary-light transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-dnk-primary mb-2">Edit Quest</h1>
        <p className="text-text-muted">Update quest details and settings</p>
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
                    options={['Novice', 'Adept', 'Master', 'Legendary'] as const}
                    required
                  />
                </div>

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
                          <div>
                            <label className="block text-text-light text-sm font-medium mb-2">
                              Task Description *
                            </label>
                            <input
                              type="text"
                              value={task.description}
                              onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                              className="w-full px-4 py-3 bg-dnk-surface border border-dnk-accent/20 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-dnk-primary focus:border-transparent"
                              required
                            />
                          </div>

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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.title || !formData.description}
                    className="bg-dnk-primary hover:bg-dnk-primary-dark disabled:bg-dnk-secondary disabled:cursor-not-allowed text-dnk-surface px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <span>{isSubmitting ? '⏳' : '✏️'}</span>
                    {isSubmitting ? 'Updating...' : 'Update Quest'}
                  </button>
                  <Link
                    to="/dashboard"
                    className="bg-dnk-secondary hover:bg-dnk-secondary/80 text-text-light px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Quest Preview */}
        <div className="space-y-6">
          <div className="bg-dnk-secondary/50 rounded-lg border border-dnk-accent/20 p-6">
            <h3 className="text-lg font-medium text-dnk-primary mb-4">Quest Preview</h3>
            <div className="space-y-3 text-sm text-text-muted">
              <div className="bg-dnk-surface/30 rounded-lg p-4">
                <h4 className="text-text-light font-medium">{formData.title || 'Quest Title'}</h4>
                <p className="text-text-muted text-sm mt-2">{formData.description || 'Quest description will appear here...'}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="bg-dnk-primary/20 text-dnk-primary px-2 py-1 rounded-full text-xs">
                    {formData.category}
                  </span>
                  {formData.deadline && (
                    <span className="text-text-muted text-xs">
                      Deadline: {new Date(formData.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditQuest;