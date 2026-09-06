export interface ProductMarketingContent {
  productId?: number;
  brand?: string;
  claim?: string;
  shortDescription?: string;
  benefits?: string[];
  fragranceFamily?: string;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  recommendedFor?: string[];
  recommendedOccasions?: string[];
  season?: string[];
  faqs?: {
    question: string;
    answer: string;
  }[];
  seoTitle?: string;
  seoDescription?: string;
  notes?: {
    icon: string;
    label: string;
    title: string;
    desc: string;
  }[];
}
