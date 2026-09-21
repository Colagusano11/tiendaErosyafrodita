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
  testimonials?: {
    name: string;
    text: string;
    rating?: number;
    photo?: string;
  }[];
  beforeAfter?: {
    beforeImage: string;
    afterImage: string;
    caption?: string;
    weeks?: number;
  }[];
  videoUrl?: string;
  videoPoster?: string;
  youtubeUrl?: string;
  audienceFit?: {
    title: string;
    description: string;
  }[];
  productInfo?: string;
  application?: string;
  ingredients?: string;
  manufacturerInfo?: string;
}
