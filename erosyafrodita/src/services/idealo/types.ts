// Tipos para la API de Idealo Partner Web Service 2.0

export interface IdealoCredentials {
  clientId: string;
  clientSecret: string;
}

export interface IdealoAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  shop_id: number;
}

export interface IdealoOffer {
  sku: string;
  title?: string;
  price?: number;
  url?: string;
  basePrice?: number;
  vat?: number;
  deliveryCosts?: DeliveryCost[];
  deliveryComment?: string;
  freeReturnDays?: number;
  checkAge?: string;
  availability?: string;
  eans?: string[];
  categoryPath?: string;
  brand?: string;
  merchantName?: string;
  merchantCategory?: string;
  description?: string;
  imageUrls?: string[];
  ecoParticipation?: number;
  deposit?: number;
  skuOfBaseOffer?: string;
  energyClass?: string;
  color?: string;
  size?: string;
  material?: string;
  gender?: string;
  condition?: string;
  weight?: string;
  tsin?: string;
  productVariation?: string;
  minimumPrice?: number;
  maximumPrice?: number;
  replicatorManaged?: boolean;
  dynamicPricingManaged?: boolean;
  shopUrls?: ShopUrl[];
  dealerFeeManaged?: boolean;
  dealerFee?: number;
}

export interface DeliveryCost {
  country: string;
  cost: number;
}

export interface ShopUrl {
  url: string;
  country: string;
}

export interface IdealoApiError {
  error: string;
  message: string;
  path: string;
  status: number;
  timestamp: string;
}

export interface IdealoFieldError {
  field: string;
  rejectedValue: any;
  message: string;
}

export interface IdealoValidationError extends IdealoApiError {
  errors: IdealoFieldError[];
}
