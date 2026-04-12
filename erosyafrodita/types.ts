
export interface Product {
  id: string;
  name: string;
  brand: string;
  price: string;
  originalPrice?: string;
  img: string;
  tag?: string;
  tagColor?: string;
  category: 'floral' | 'amaderado' | 'oriental' | 'citrico';
  rating: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  name: string;
  email: string;
  phone: string;
  tier: 'Gold' | 'Silver' | 'Platinum';
  avatar: string;
  points: number;
  wishlistCount: number;
  activeOrders: number;
}
