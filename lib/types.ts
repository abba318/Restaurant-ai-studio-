export type FulfillmentType = 'delivery' | 'pickup';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'success'
  | 'failed'
  | 'abandoned';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number; // in NGN (Naira)
  description: string;
  image: string;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  spicyLevel: 0 | 1 | 2 | 3; // 0: Mild, 1: Medium, 2: Spicy, 3: Extra Hot
  tags: string[];
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  unitPrice: number; // in NGN (validated server-side)
  quantity: number;
  totalPrice: number; // in NGN
  specialInstructions?: string;
  image?: string;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  address?: string;
  deliveryArea?: string;
  notes?: string;
}

export interface OrderLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  mapUrl: string;
  capturedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. #NG-8492
  customer: OrderCustomer;
  fulfillmentType: FulfillmentType;
  items: OrderItem[];
  subtotal: number; // in NGN
  deliveryFee: number; // in NGN
  total: number; // in NGN (subtotal + deliveryFee)
  totalKobo: number; // total * 100
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentId?: string;
  location?: OrderLocation;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  reference: string;
  amountKobo: number;
  amountNaira: number;
  currency: 'NGN';
  status: PaymentStatus;
  paystackAccessCode?: string;
  authorizationUrl?: string;
  channel?: string;
  gatewayResponse?: string;
  paidAt?: string;
  verifiedAt?: string;
  webhookProcessedAt?: string;
  rawVerificationData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number; // in NGN
  estimatedMinutes: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  currencySymbol: string;
  deliveryBaseFee: number;
  freeDeliveryThreshold: number;
  isOnlineOrderingOpen: boolean;
  estimatedDeliveryTime: string;
  estimatedPickupTime: string;
  paystackMode: 'test' | 'live';
  paystackTestPublicKey: string;
  paystackTestSecretKey: string;
  paystackLivePublicKey: string;
  paystackLiveSecretKey: string;
  deliveryZones: DeliveryZone[];
  gmailUser?: string;
  gmailAppPassword?: string;
  sendCustomerEmails?: boolean;
  adminPasswordHash?: string;
  adminSalt?: string;
}

export interface WebhookEventRecord {
  id: string;
  event: string;
  reference: string;
  receivedAt: string;
  payloadSummary: Record<string, unknown>;
}

export interface DatabaseSchema {
  menuItems: MenuItem[];
  orders: Order[];
  payments: PaymentRecord[];
  settings: RestaurantSettings;
  webhookEvents: WebhookEventRecord[];
}
