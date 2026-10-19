import fs from 'fs';
import path from 'path';
import {
  DatabaseSchema,
  MenuItem,
  Order,
  PaymentRecord,
  RestaurantSettings,
  WebhookEventRecord,
  OrderStatus,
  PaymentStatus,
} from './types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'restaurant-db.json');

const INITIAL_SETTINGS: RestaurantSettings = {
  restaurantName: 'NaijaGrill & Kitchen',
  tagline: 'Smoky Firewood Jollof, Suya & Heritage Nigerian Soul Food',
  phone: '+234 803 555 0192',
  email: 'orders@naijagrill.ng',
  address: '14B Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  currency: 'NGN',
  currencySymbol: '₦',
  deliveryBaseFee: 1500,
  freeDeliveryThreshold: 25000,
  isOnlineOrderingOpen: true,
  estimatedDeliveryTime: '35 - 50 mins',
  estimatedPickupTime: '20 - 25 mins',
  paystackMode: 'test',
  paystackTestPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_bc8100b5bcc6467f1f0ec658dec54da1d564ffae',
  paystackTestSecretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_ab28d898f958c3d3992427861f8f44cd876ad1be',
  paystackLivePublicKey: '',
  paystackLiveSecretKey: '',
  deliveryZones: [
    { id: 'zone-1', name: 'Lekki Phase 1 & Oniru', fee: 1500, estimatedMinutes: '25-35 mins' },
    { id: 'zone-2', name: 'Victoria Island & Ikoyi', fee: 1800, estimatedMinutes: '35-45 mins' },
    { id: 'zone-3', name: 'Lagos Island, Marina & CMS', fee: 2200, estimatedMinutes: '40-50 mins' },
    { id: 'zone-4', name: 'Ikeja, Maryland & GRA', fee: 3200, estimatedMinutes: '50-65 mins' },
    { id: 'zone-5', name: 'Surulere & Yaba', fee: 2800, estimatedMinutes: '45-60 mins' },
    { id: 'zone-6', name: 'Ajah, Chevron & Sangotedo', fee: 2500, estimatedMinutes: '40-55 mins' },
  ],
};

const INITIAL_MENU: MenuItem[] = [
  {
    id: 'menu-1',
    name: 'Firewood Smokey Jollof Royale',
    category: 'Rice & Grains',
    price: 7800,
    description: 'Authentic Nigerian firewood-smoked Jollof rice served with caramelized sweet plantain (Dodo), tender fried goat meat, and slow-braised pepper sauce.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 20,
    spicyLevel: 2,
    tags: ['Best Seller', 'Signature', 'Smokey'],
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'menu-2',
    name: 'Lagos Suya Skewer Supreme',
    category: 'Grill & Suya',
    price: 5200,
    description: 'Thinly sliced flank steak marinated in authentic Northern Yaji spice blend, char-grilled over white hot coals. Served with raw red onions, tomatoes & extra suya pepper.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 18,
    spicyLevel: 3,
    tags: ['Spicy 🔥', 'Grilled', 'Gluten-Free'],
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'menu-3',
    name: 'Slow-Roasted Peppered Asun',
    category: 'Grill & Suya',
    price: 6800,
    description: 'Tender diced goat meat fire-roasted with fresh Scotch bonnet habaneros, sweet bell peppers, red onions, and aromatic herbs. Lagos street party perfection.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 25,
    spicyLevel: 3,
    tags: ['Chef Pick ⭐', 'Extra Hot', 'Goat Meat'],
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'menu-4',
    name: 'Traditional Egusi Soup & Pounded Yam',
    category: 'Soups & Swallows',
    price: 8900,
    description: 'Rich melon seed soup simmered with dried stockfish, tender beef shaki, cow leg, and fresh bitterleaf/spinach. Served with piping hot smooth pounded yam.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 25,
    spicyLevel: 2,
    tags: ['Heritage', 'Soups', 'Authentic'],
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'menu-5',
    name: 'Rich Efo Riro Elegusi',
    category: 'Soups & Swallows',
    price: 8500,
    description: 'Lagos-style rich spinach stew with smoked catfish, pan-seared pomo, dried crayfish, and assorted meats. Served with your choice of Pounded Yam, Eba, or Amala.',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 22,
    spicyLevel: 2,
    tags: ['Soups', 'Rich', 'Assorted Meat'],
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'menu-6',
    name: 'Seafood Okra Royale',
    category: 'Soups & Swallows',
    price: 12500,
    description: 'Crunchy diced fresh okra enriched with Atlantic tiger prawns, blue swimming crab, calamari, smoked catfish, and aromatic uziza leaves.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 28,
    spicyLevel: 2,
    tags: ['Seafood Premium', 'Chef Pick ⭐'],
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'menu-7',
    name: 'Golden Puff-Puff with Cinnamon Glaze',
    category: 'Small Chops & Starters',
    price: 2800,
    description: 'Six pillowy, golden deep-fried yeast dough balls infused with grated nutmeg and drizzled with a light spiced honey syrup.',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 12,
    spicyLevel: 0,
    tags: ['Sweet', 'Small Chops', 'Vegetarian'],
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'menu-8',
    name: 'Peppered Jumbo Snail Delicacy',
    category: 'Small Chops & Starters',
    price: 9500,
    description: 'Plump African giant land snails sautéed in a rich, fiery reduction of Scotch bonnets, habaneros, sweet bell peppers, and fresh onions.',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 20,
    spicyLevel: 3,
    tags: ['Luxury Starter', 'Spicy 🔥'],
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'menu-9',
    name: 'Signature Nigerian Chapman Cocktail',
    category: 'Drinks & Beverages',
    price: 2400,
    description: 'Lagos club legend drink crafted with Fanta, Sprite, Angostura aromatic bitters, Grenadine syrup, and fresh citrus wheels over crushed ice.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 5,
    spicyLevel: 0,
    tags: ['Refreshing', 'Mocktail', 'Classic'],
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'menu-10',
    name: 'Chilled Spiced Zobo Infusion',
    category: 'Drinks & Beverages',
    price: 1800,
    description: 'Deep ruby organic hibiscus flower tea simmered with fresh ginger root, whole cloves, dried pineapple rind, and natural cane sweetness.',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 5,
    spicyLevel: 1,
    tags: ['Organic', 'Anti-Oxidant', 'Traditional'],
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'menu-11',
    name: 'Grand Lekki Feast Platter (Serves 3-4)',
    category: 'Chef Platters',
    price: 26500,
    description: 'The ultimate celebration spread: Smokey Jollof Rice, Special Fried Rice, Grilled Peppered Asun, 4 Beef Suya skewers, Golden Dodo, Crispy Peppered Croaker Fish & Puff-Puff.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    preparationTimeMinutes: 35,
    spicyLevel: 2,
    tags: ['Family Sharing', 'Feast', 'Chef Pick ⭐'],
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class PersistentDatabase {
  private memoryCache: DatabaseSchema | null = null;
  private writeLockPromise: Promise<void> = Promise.resolve();

  constructor() {
    this.ensureDbInitialized();
  }

  private ensureDbInitialized(): void {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DatabaseSchema = {
        menuItems: INITIAL_MENU,
        orders: [],
        payments: [],
        settings: INITIAL_SETTINGS,
        webhookEvents: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      this.memoryCache = initialDb;
    }
  }

  private async readDb(): Promise<DatabaseSchema> {
    if (this.memoryCache) {
      return this.memoryCache;
    }

    this.ensureDbInitialized();

    try {
      const data = await fs.promises.readFile(DB_FILE, 'utf-8');
      this.memoryCache = JSON.parse(data) as DatabaseSchema;
      return this.memoryCache;
    } catch {
      // Fallback if read or parse fails
      const fallback: DatabaseSchema = {
        menuItems: INITIAL_MENU,
        orders: [],
        payments: [],
        settings: INITIAL_SETTINGS,
        webhookEvents: [],
      };
      this.memoryCache = fallback;
      return fallback;
    }
  }

  private async writeDb(data: DatabaseSchema): Promise<void> {
    this.memoryCache = data;

    // Serialize file writes to prevent race conditions
    this.writeLockPromise = this.writeLockPromise.then(async () => {
      const tempPath = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
      await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      await fs.promises.rename(tempPath, DB_FILE);
    });

    await this.writeLockPromise;
  }

  // --- MENU ITEMS ---

  async getMenuItems(onlyAvailable = false): Promise<MenuItem[]> {
    const db = await this.readDb();
    if (onlyAvailable) {
      return db.menuItems.filter((item) => item.isAvailable);
    }
    return db.menuItems;
  }

  async getMenuItemById(id: string): Promise<MenuItem | null> {
    const db = await this.readDb();
    return db.menuItems.find((item) => item.id === id) || null;
  }

  async createMenuItem(item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem> {
    const db = await this.readDb();
    const newItem: MenuItem = {
      ...item,
      id: `menu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.menuItems.push(newItem);
    await this.writeDb(db);
    return newItem;
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    const db = await this.readDb();
    const index = db.menuItems.findIndex((item) => item.id === id);
    if (index === -1) return null;

    db.menuItems[index] = {
      ...db.menuItems[index],
      ...updates,
      id, // protect immutable id
      updatedAt: new Date().toISOString(),
    };

    await this.writeDb(db);
    return db.menuItems[index];
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    const db = await this.readDb();
    const initialLen = db.menuItems.length;
    db.menuItems = db.menuItems.filter((item) => item.id !== id);
    if (db.menuItems.length !== initialLen) {
      await this.writeDb(db);
      return true;
    }
    return false;
  }

  // --- ORDERS ---

  async getOrders(limitCount = 100): Promise<Order[]> {
    const db = await this.readDb();
    return [...db.orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  }

  async getOrderById(id: string): Promise<Order | null> {
    const db = await this.readDb();
    return db.orders.find((o) => o.id === id) || null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const db = await this.readDb();
    const cleanNumber = orderNumber.trim().toUpperCase();
    return db.orders.find((o) => o.orderNumber.toUpperCase() === cleanNumber) || null;
  }

  async getOrderByPaymentReference(ref: string): Promise<Order | null> {
    const db = await this.readDb();
    return db.orders.find((o) => o.paymentReference === ref) || null;
  }

  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'statusHistory' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const db = await this.readDb();
    const now = new Date().toISOString();
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `NG-${randomHex}`;

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      statusHistory: [
        {
          status: orderData.status,
          timestamp: now,
          note: 'Order created',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.orders.push(newOrder);
    await this.writeDb(db);
    return newOrder;
  }

  async updateOrderStatus(id: string, newStatus: OrderStatus, note?: string): Promise<Order | null> {
    const db = await this.readDb();
    const index = db.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;

    const currentOrder = db.orders[index];
    const now = new Date().toISOString();

    currentOrder.status = newStatus;
    currentOrder.statusHistory.push({
      status: newStatus,
      timestamp: now,
      note: note || `Status updated to ${newStatus}`,
    });
    currentOrder.updatedAt = now;

    await this.writeDb(db);
    return currentOrder;
  }

  async updateOrderPayment(id: string, paymentStatus: PaymentStatus, paymentReference?: string, paymentId?: string): Promise<Order | null> {
    const db = await this.readDb();
    const index = db.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;

    const order = db.orders[index];
    const now = new Date().toISOString();

    order.paymentStatus = paymentStatus;
    if (paymentReference) order.paymentReference = paymentReference;
    if (paymentId) order.paymentId = paymentId;

    if (paymentStatus === 'success' && order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        timestamp: now,
        note: `Payment confirmed via Paystack (${paymentReference})`,
      });
    }

    order.updatedAt = now;
    await this.writeDb(db);
    return order;
  }

  async updateOrderLocation(id: string, location: import('./types').OrderLocation): Promise<Order | null> {
    const db = await this.readDb();
    const index = db.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;

    db.orders[index].location = location;
    db.orders[index].updatedAt = new Date().toISOString();
    await this.writeDb(db);
    return db.orders[index];
  }

  // --- PAYMENTS ---

  async createPaymentRecord(data: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentRecord> {
    const db = await this.readDb();
    const now = new Date().toISOString();
    const record: PaymentRecord = {
      ...data,
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    db.payments.push(record);
    await this.writeDb(db);
    return record;
  }

  async getPaymentByReference(reference: string): Promise<PaymentRecord | null> {
    const db = await this.readDb();
    return db.payments.find((p) => p.reference === reference) || null;
  }

  async updatePaymentRecord(reference: string, updates: Partial<PaymentRecord>): Promise<PaymentRecord | null> {
    const db = await this.readDb();
    const index = db.payments.findIndex((p) => p.reference === reference);
    if (index === -1) return null;

    db.payments[index] = {
      ...db.payments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.writeDb(db);
    return db.payments[index];
  }

  async getPayments(limitCount = 100): Promise<PaymentRecord[]> {
    const db = await this.readDb();
    return [...db.payments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  }

  // --- SETTINGS ---

  async getSettings(): Promise<RestaurantSettings> {
    const db = await this.readDb();
    return db.settings;
  }

  async updateSettings(updates: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    const db = await this.readDb();
    db.settings = {
      ...db.settings,
      ...updates,
    };
    await this.writeDb(db);
    return db.settings;
  }

  // --- WEBHOOK IDEMPOTENCY ---

  async isWebhookEventProcessed(reference: string, event: string): Promise<boolean> {
    const db = await this.readDb();
    return db.webhookEvents.some((e) => e.reference === reference && e.event === event);
  }

  async recordWebhookEvent(event: string, reference: string, payloadSummary: Record<string, unknown>): Promise<void> {
    const db = await this.readDb();
    db.webhookEvents.push({
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event,
      reference,
      receivedAt: new Date().toISOString(),
      payloadSummary,
    });
    // Keep last 500 events
    if (db.webhookEvents.length > 500) {
      db.webhookEvents = db.webhookEvents.slice(-500);
    }
    await this.writeDb(db);
  }

  // --- STATS / ANALYTICS ---

  async getAnalytics() {
    const db = await this.readDb();
    const orders = db.orders;

    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.paymentStatus === 'success');
    const totalRevenueNaira = paidOrders.reduce((sum, o) => sum + o.total, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr));
    const todayRevenueNaira = todayOrders
      .filter((o) => o.paymentStatus === 'success')
      .reduce((sum, o) => sum + o.total, 0);

    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const preparingCount = orders.filter((o) => o.status === 'preparing').length;
    const outForDeliveryCount = orders.filter((o) => o.status === 'out_for_delivery').length;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

    return {
      totalOrders,
      paidOrdersCount: paidOrders.length,
      totalRevenueNaira,
      todayOrdersCount: todayOrders.length,
      todayRevenueNaira,
      averageOrderValueNaira: paidOrders.length > 0 ? Math.round(totalRevenueNaira / paidOrders.length) : 0,
      statusCounts: {
        pending: pendingCount,
        preparing: preparingCount,
        out_for_delivery: outForDeliveryCount,
        delivered: deliveredCount,
      },
    };
  }
}

export const db = new PersistentDatabase();
