
// API verification utilities for social media tasks
export interface VerificationResult {
  success: boolean;
  error?: string;
  retryAfter?: number;
}

export interface TwitterVerificationData {
  tweetUrl?: string;
  username?: string;
  followUsername?: string;
}

export interface DiscordVerificationData {
  discordId?: string;
  serverId?: string;
  username?: string;
}

// Mock API calls - replace with actual API endpoints
export const verifyTwitterTask = async (data: TwitterVerificationData): Promise<VerificationResult> => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate random success/failure for demo
    const success = Math.random() > 0.3;
    
    if (!success) {
      return {
        success: false,
        error: "Unable to verify Twitter task. Please ensure you've completed the action and try again.",
        retryAfter: 20
      };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
      retryAfter: 20
    };
  }
};

export const verifyDiscordTask = async (data: DiscordVerificationData): Promise<VerificationResult> => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simulate random success/failure for demo
    const success = Math.random() > 0.2;
    
    if (!success) {
      return {
        success: false,
        error: "Unable to verify Discord task. Please ensure you've joined the server and try again.",
        retryAfter: 20
      };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
      retryAfter: 20
    };
  }
};

export const verifyUrlTask = async (url: string): Promise<VerificationResult> => {
  try {
    // Basic URL validation
    if (!url || !isValidUrl(url)) {
      return {
        success: false,
        error: "Please provide a valid URL.",
        retryAfter: 0
      };
    }
    
    // Simulate API verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = Math.random() > 0.25;
    
    if (!success) {
      return {
        success: false,
        error: "Unable to verify the provided URL. Please check and try again.",
        retryAfter: 20
      };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Verification failed. Please try again.",
      retryAfter: 20
    };
  }
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
