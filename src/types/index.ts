export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price?: number;
  imageUrl: string;
  imageHint: string;
  stock: {
    shopify: number;
    square: number;
    amazon?: number;
  };
  // Multi-location inventory
  locations?: {
    [locationId: string]: {
      quantity: number;
      minStockLevel?: number;
    };
  };
  totalQuantity?: number;
  // Platform IDs for syncing
  squareVariationId?: string;
  shopifyVariantId?: string;
  amazonSku?: string;
  amazonAsin?: string;
  // Bundle configuration
  isBundle?: boolean;
  bundleComponents?: Array<{
    productId: string;
    quantity: number;
  }>;
  lowStockThreshold?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductFormData {
  name: string;
  sku: string;
  description?: string;
  price?: number;
  imageHint: string;
  stock: {
    shopify: number;
    square: number;
    amazon?: number;
  };
}

export interface UploadProgress {
  isUploading: boolean;
  progress: number;
}

// Platform product types
export type Platform = 'shopify' | 'square' | 'amazon';

export interface PlatformProduct {
  id: string;
  variantId?: string;
  sku?: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  inventory?: number;
  platform: Platform;
  rawData?: any; // Store raw platform data for reference
}

// Product mapping types
export interface ProductMapping {
  id: string;
  localProductId: string;
  localSku: string;
  shopifyProductId?: string;
  shopifyVariantId?: string;
  squareItemVariationId?: string;
  squareCatalogObjectId?: string;
  amazonAsin?: string;
  amazonSku?: string;
  matchedAt: Date;
  matchedBy: 'ai' | 'manual';
  confidence?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Match suggestion types
export interface MatchSuggestion {
  id: string;
  localProduct: Product;
  platformProduct: PlatformProduct;
  platform: Platform;
  confidence: number;
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// Training data for AI learning
export interface MatchTraining {
  id: string;
  localSku: string;
  platformSku: string;
  platform: Platform;
  wasMatch: boolean;
  aiConfidence: number;
  aiReasoning: string;
  createdAt: Date;
}

// Sync log types
export interface SyncLog {
  id: string;
  platform: Platform;
  action: 'fetch' | 'update' | 'sync' | 'error';
  status: 'success' | 'failed' | 'partial';
  itemsProcessed: number;
  itemsFailed: number;
  message?: string;
  details?: any;
  createdAt: Date;
}

// Inventory discrepancy types
export interface InventoryDiscrepancy {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  platform: Platform;
  localStock: number;
  platformStock: number;
  difference: number;
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

// Location types
export type LocationType = 'warehouse' | 'retail' | 'fulfillment' | 'other';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  isActive: boolean;
  isPrimary?: boolean; // Primary location for sales
  createdAt: Date;
  updatedAt?: Date;
}

export interface LocationFormData {
  name: string;
  type: LocationType;
  isActive: boolean;
  isPrimary?: boolean;
}

// Transaction types
export type TransactionType = 'sale' | 'transfer' | 'production' | 'adjustment';
export type TransactionSource = 'square' | 'shopify' | 'amazon' | 'manual' | 'webhook';

export interface InventoryTransaction {
  id: string;
  type: TransactionType;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number; // positive for additions, negative for deductions
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;
  batchNumber?: string;
  productionDate?: Date;
  expirationDate?: Date;
  source: TransactionSource;
  userId?: string;
  notes?: string;
  orderId?: string; // For sales transactions
  createdAt: Date;
}

export interface TransactionFormData {
  type: TransactionType;
  productId: string;
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
  batchNumber?: string;
  productionDate?: Date;
  expirationDate?: Date;
  notes?: string;
}

// Bundle types
export interface ProductBundle {
  id: string;
  bundleProductId: string;
  bundleProductName: string;
  bundleSku: string;
  componentProducts: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BundleFormData {
  bundleProductId: string;
  componentProducts: Array<{
    productId: string;
    quantity: number;
  }>;
  isActive: boolean;
}
