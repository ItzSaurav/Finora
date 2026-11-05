export type ProductCategory = 
  | 'Grains & Atta'
  | 'Edible Oils & Ghee'
  | 'Spices & Masalas'
  | 'Dairy & Staples'
  | 'Packaged Snacks'
  | 'Personal & Home Care';

export type StockStatus = 'optimal' | 'low_stock' | 'expiring' | 'dead_stock';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  nameHindi: string;
  category: ProductCategory;
  packSize: string;
  mrp: number; // Maximum Retail Price
  sellingPrice: number; // Retail counter price
  wholesaleCost: number; // Purchase price from distributor
  currentStock: number;
  safetyStock: number;
  expiryDate: string; // ISO date string
  status: StockStatus;
  distributorName: string;
  dailyVelocity: number; // units sold per day
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPerUnit?: number;
}

export type PaymentMethod = 'cash' | 'upi' | 'khata';

export interface SaleTransaction {
  id: string;
  receiptNumber: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  profitTotal: number;
}

export interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  locality: string;
  balanceDue: number; // positive means customer owes money
  lastTransactionDate: string;
  daysPending: number;
  creditLimit: number;
  trustScore: 'high' | 'medium' | 'critical';
  history: {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'payment';
  }[];
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  category: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  itemsSummary: string;
}

export interface AIPrediction {
  id: string;
  type: 'surge' | 'stockout' | 'arbitrage' | 'capital_leak';
  title: string;
  description: string;
  metricBadge: string;
  actionLabel: string;
  urgency: 'high' | 'medium' | 'info';
  impactAmountRupees: number;
}
