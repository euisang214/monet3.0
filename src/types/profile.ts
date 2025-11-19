export interface ProfileResponse {
  identity: { name?: string; email?: string; redacted?: boolean };
  title?: string;
  priceUSD?: number;
  tags?: string[];
  verified?: boolean;
  bio?: string;
  employer?: string;
  resumeUrl?: string;
  experience?: {
    firm: string;
    title: string;
    startDate?: string;
    endDate?: string;
  }[];
  education?: {
    school: string;
    title: string;
    startDate?: string;
    endDate?: string;
  }[];
  interests?: string[];
  activities?: string[];
  reviews?: {
    rating: number;
    text: string;
    submittedAt: string;
  }[];
  averageRating?: number;
  totalReviews?: number;
}
