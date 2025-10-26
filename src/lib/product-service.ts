import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    serverTimestamp,
    query,
    orderBy
} from 'firebase/firestore';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { db, storage } from './firebase';
import type { Product, ProductFormData } from '@/types';

const PRODUCTS_COLLECTION = 'products';
const IMAGES_PATH = 'product-images';

export class ProductService {
    // Get all products
    static async getAllProducts(): Promise<Product[]> {
        try {
            const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('name'));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as Product[];
        } catch (error) {
            console.error('Error fetching products:', error);
            throw new Error('Failed to fetch products');
        }
    }

    // Get a single product
    static async getProduct(id: string): Promise<Product | null> {
        try {
            const docRef = doc(db, PRODUCTS_COLLECTION, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt?.toDate(),
                    updatedAt: docSnap.data().updatedAt?.toDate(),
                } as Product;
            }

            return null;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw new Error('Failed to fetch product');
        }
    }

    // Create a new product
    static async createProduct(productData: ProductFormData, imageFile?: File): Promise<string> {
        try {
            let imageUrl = '';

            if (imageFile) {
                imageUrl = await this.uploadImage(imageFile);
            }

            const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
                ...productData,
                imageUrl,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            return docRef.id;
        } catch (error) {
            console.error('Error creating product:', error);
            throw new Error('Failed to create product');
        }
    }

    // Update an existing product
    static async updateProduct(
        id: string,
        productData: Partial<ProductFormData>,
        imageFile?: File
    ): Promise<void> {
        try {
            const docRef = doc(db, PRODUCTS_COLLECTION, id);
            const updateData: any = {
                ...productData,
                updatedAt: serverTimestamp(),
            };

            if (imageFile) {
                // Upload new image
                const newImageUrl = await this.uploadImage(imageFile, id);
                updateData.imageUrl = newImageUrl;

                // Optionally delete old image (you might want to keep it for backup)
                // const oldProduct = await this.getProduct(id);
                // if (oldProduct?.imageUrl) {
                //   await this.deleteImage(oldProduct.imageUrl);
                // }
            }

            await updateDoc(docRef, updateData);
        } catch (error) {
            console.error('Error updating product:', error);
            throw new Error('Failed to update product');
        }
    }

    // Delete a product
    static async deleteProduct(id: string): Promise<void> {
        try {
            // Get product to access image URL for deletion
            const product = await this.getProduct(id);

            // Delete the document
            await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));

            // Delete associated image
            if (product?.imageUrl) {
                await this.deleteImage(product.imageUrl);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            throw new Error('Failed to delete product');
        }
    }

    // Upload image to Firebase Storage
    static async uploadImage(
        file: File,
        productId?: string,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        try {
            const fileName = productId
                ? `${productId}_${Date.now()}_${file.name}`
                : `${Date.now()}_${file.name}`;

            const storageRef = ref(storage, `${IMAGES_PATH}/${fileName}`);

            return new Promise((resolve, reject) => {
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        if (onProgress) {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            onProgress(progress);
                        }
                    },
                    (error) => {
                        console.error('Error uploading image:', error);
                        reject(new Error('Failed to upload image'));
                    },
                    async () => {
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        } catch (error) {
                            reject(new Error('Failed to get download URL'));
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error in uploadImage:', error);
            throw new Error('Failed to upload image');
        }
    }

    // Delete image from Firebase Storage
    static async deleteImage(imageUrl: string): Promise<void> {
        try {
            // Extract the file path from the URL
            const url = new URL(imageUrl);
            const pathSegments = url.pathname.split('/');
            const encodedPath = pathSegments[pathSegments.length - 1];
            const filePath = decodeURIComponent(encodedPath);

            const imageRef = ref(storage, filePath);
            await deleteObject(imageRef);
        } catch (error) {
            console.error('Error deleting image:', error);
            // Don't throw here as the product deletion should still succeed
            // even if image deletion fails
        }
    }

    // Update stock for a specific product
    static async updateStock(
        id: string,
        stock: { shopify: number; square: number }
    ): Promise<void> {
        try {
            const docRef = doc(db, PRODUCTS_COLLECTION, id);
            await updateDoc(docRef, {
                stock,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating stock:', error);
            throw new Error('Failed to update stock');
        }
    }

    // Update location quantity for a product
    static async updateLocationQuantity(
        productId: string,
        locationId: string,
        quantity: number
    ): Promise<void> {
        try {
            const docRef = doc(db, PRODUCTS_COLLECTION, productId);
            const productDoc = await getDoc(docRef);

            if (!productDoc.exists()) {
                throw new Error('Product not found');
            }

            const product = productDoc.data();
            const locations = product.locations || {};

            // Update the specific location quantity
            locations[locationId] = {
                quantity,
                minStockLevel: locations[locationId]?.minStockLevel || 0,
            };

            // Calculate total quantity across all locations
            const totalQuantity = Object.values(locations).reduce(
                (sum: number, loc: any) => sum + (loc.quantity || 0),
                0
            );

            await updateDoc(docRef, {
                locations,
                totalQuantity,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating location quantity:', error);
            throw error;
        }
    }

    // Get total quantity across all locations
    static getTotalQuantity(product: Product): number {
        if (!product.locations) return 0;

        return Object.values(product.locations).reduce(
            (sum, loc) => sum + (loc.quantity || 0),
            0
        );
    }

    // Check if product has low stock at any location
    static hasLowStock(product: Product): boolean {
        if (!product.locations || !product.lowStockThreshold) return false;

        const totalQty = this.getTotalQuantity(product);
        return totalQty <= product.lowStockThreshold;
    }

    // Check if a SKU already exists
    static async checkSkuExists(sku: string): Promise<boolean> {
        try {
            const q = query(collection(db, PRODUCTS_COLLECTION));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.some(doc => doc.data().sku === sku);
        } catch (error) {
            console.error('Error checking SKU existence:', error);
            throw new Error('Failed to check SKU');
        }
    }

    // Get product by SKU
    static async getProductBySku(sku: string): Promise<Product | null> {
        try {
            const q = query(collection(db, PRODUCTS_COLLECTION));
            const querySnapshot = await getDocs(q);

            const doc = querySnapshot.docs.find(doc => doc.data().sku === sku);

            if (doc) {
                return {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate(),
                } as Product;
            }

            return null;
        } catch (error) {
            console.error('Error fetching product by SKU:', error);
            throw new Error('Failed to fetch product by SKU');
        }
    }

    // Get all SKUs (for efficient lookup)
    static async getAllSkus(): Promise<Set<string>> {
        try {
            const q = query(collection(db, PRODUCTS_COLLECTION));
            const querySnapshot = await getDocs(q);

            const skus = new Set<string>();
            querySnapshot.docs.forEach(doc => {
                const sku = doc.data().sku;
                if (sku) skus.add(sku);
            });

            return skus;
        } catch (error) {
            console.error('Error fetching SKUs:', error);
            throw new Error('Failed to fetch SKUs');
        }
    }
} 