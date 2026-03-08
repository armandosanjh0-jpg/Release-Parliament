export interface VoteBreakdown {
  yea: number;
  nay: number;
  paired?: number;
  abstain?: number;
}

export interface PersonVote {
  name: string;
  party: string;
  constituency?: string;
  vote: 'Yea' | 'Nay' | 'Paired' | 'Absent';
}

export interface Bill {
  id: string;
  number: string;
  title: string;
  status: string;
  session: string;
  introducedAt?: string;
  sponsor?: string;
  type?: 'Government' | 'Private Member' | 'Senate Public Bill';
  summary?: string;
  sourceUrl: string;
}

export interface BillWithVotes extends Bill {
  textUrl?: string;
  voteBreakdown?: VoteBreakdown;
  votes?: PersonVote[];
}
