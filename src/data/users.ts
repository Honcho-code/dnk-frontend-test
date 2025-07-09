export type User = {
  wallet: string;
  alias: string;
  xp: number;
  rank: number;
  avatar: string;
  completed: string[];
};

export const demoUsers: User[] = [
  {
    wallet: "DHg8A91eXy...",
    alias: "dustdoge",
    xp: 85,
    rank: 1,
    avatar: "https://example.com/avatar1.png",
    completed: ["demo001", "demo002"]
  },
  {
    wallet: "DBxXf72kLp...",
    alias: "questqueen",
    xp: 65,
    rank: 2,
    avatar: "https://example.com/avatar2.png",
    completed: ["demo001"]
  },
  {
    wallet: "DMPzL29eWo...",
    alias: "woofwizard",
    xp: 40,
    rank: 3,
    avatar: "https://example.com/avatar3.png",
    completed: []
  }
];

export const adminWallets: string[] = [
  "0xbf82e1ea36e2a7e19f7d014de7760507eaecbb84"
];