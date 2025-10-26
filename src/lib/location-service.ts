import { adminDb } from './firebase-admin';
import type { Location, LocationFormData } from '@/types';

const LOCATIONS_COLLECTION = 'locations';

export class LocationService {
    // Get all locations
    static async getAllLocations(): Promise<Location[]> {
        try {
            const snapshot = await adminDb
                .collection(LOCATIONS_COLLECTION)
                .get();

            const locations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as Location[];

            // Sort by name client-side
            return locations.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error fetching locations:', error);
            throw new Error('Failed to fetch locations');
        }
    }

    // Get active locations only
    static async getActiveLocations(): Promise<Location[]> {
        try {
            const snapshot = await adminDb
                .collection(LOCATIONS_COLLECTION)
                .where('isActive', '==', true)
                .get();

            const locations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as Location[];

            // Sort by name client-side
            return locations.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error('Error fetching active locations:', error);
            throw new Error('Failed to fetch active locations');
        }
    }

    // Get a single location
    static async getLocation(id: string): Promise<Location | null> {
        try {
            const doc = await adminDb
                .collection(LOCATIONS_COLLECTION)
                .doc(id)
                .get();

            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data()?.createdAt?.toDate(),
                updatedAt: doc.data()?.updatedAt?.toDate(),
            } as Location;
        } catch (error) {
            console.error('Error fetching location:', error);
            throw new Error('Failed to fetch location');
        }
    }

    // Get primary location (for sales)
    static async getPrimaryLocation(): Promise<Location | null> {
        try {
            const snapshot = await adminDb
                .collection(LOCATIONS_COLLECTION)
                .where('isPrimary', '==', true)
                .where('isActive', '==', true)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            } as Location;
        } catch (error) {
            console.error('Error fetching primary location:', error);
            throw new Error('Failed to fetch primary location');
        }
    }

    // Create a new location
    static async createLocation(locationData: LocationFormData): Promise<string> {
        try {
            // If setting as primary, unset other primary locations
            if (locationData.isPrimary) {
                await this.unsetAllPrimaryLocations();
            }

            const docRef = await adminDb.collection(LOCATIONS_COLLECTION).add({
                ...locationData,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return docRef.id;
        } catch (error) {
            console.error('Error creating location:', error);
            throw new Error('Failed to create location');
        }
    }

    // Update an existing location
    static async updateLocation(
        id: string,
        locationData: Partial<LocationFormData>
    ): Promise<void> {
        try {
            // If setting as primary, unset other primary locations
            if (locationData.isPrimary) {
                await this.unsetAllPrimaryLocations();
            }

            await adminDb
                .collection(LOCATIONS_COLLECTION)
                .doc(id)
                .update({
                    ...locationData,
                    updatedAt: new Date(),
                });
        } catch (error) {
            console.error('Error updating location:', error);
            throw new Error('Failed to update location');
        }
    }

    // Delete a location (only if no products are using it)
    static async deleteLocation(id: string): Promise<void> {
        try {
            // Check if any products are using this location
            const productsSnapshot = await adminDb
                .collection('products')
                .where(`locations.${id}`, '!=', null)
                .limit(1)
                .get();

            if (!productsSnapshot.empty) {
                throw new Error('Cannot delete location that is in use by products');
            }

            await adminDb.collection(LOCATIONS_COLLECTION).doc(id).delete();
        } catch (error) {
            console.error('Error deleting location:', error);
            throw error;
        }
    }

    // Helper: Unset all primary locations
    private static async unsetAllPrimaryLocations(): Promise<void> {
        const snapshot = await adminDb
            .collection(LOCATIONS_COLLECTION)
            .where('isPrimary', '==', true)
            .get();

        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isPrimary: false, updatedAt: new Date() });
        });

        await batch.commit();
    }

    // Initialize default locations (for setup)
    static async initializeDefaultLocations(): Promise<void> {
        try {
            const existingLocations = await this.getAllLocations();

            if (existingLocations.length > 0) {
                console.log('Locations already initialized');
                return;
            }

            const defaultLocations: LocationFormData[] = [
                {
                    name: 'Warehouse',
                    type: 'warehouse',
                    isActive: true,
                    isPrimary: true,
                },
                {
                    name: 'Pike Place',
                    type: 'retail',
                    isActive: true,
                },
                {
                    name: 'Amazon FBA',
                    type: 'fulfillment',
                    isActive: true,
                },
                {
                    name: 'Other',
                    type: 'other',
                    isActive: true,
                },
            ];

            const batch = adminDb.batch();
            for (const location of defaultLocations) {
                const docRef = adminDb.collection(LOCATIONS_COLLECTION).doc();
                batch.set(docRef, {
                    ...location,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            await batch.commit();
            console.log('Default locations initialized');
        } catch (error) {
            console.error('Error initializing default locations:', error);
            throw new Error('Failed to initialize default locations');
        }
    }
}

