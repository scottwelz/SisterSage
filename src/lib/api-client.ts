// Client-side API utility for secure API calls
// This shows how to use your stored API keys securely from the frontend

export class ApiClient {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    // Shopify API calls
    async getShopifyProducts() {
        const response = await fetch(`/api/shopify?userId=${this.userId}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch Shopify products');
        }

        return response.json();
    }

    async updateShopifyInventory(inventoryLevelId: string, availableQuantity: number) {
        const response = await fetch('/api/shopify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: this.userId,
                inventory_level_id: inventoryLevelId,
                available: availableQuantity,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update Shopify inventory');
        }

        return response.json();
    }

    // Square API calls
    async getSquareInventory() {
        const response = await fetch(`/api/square?userId=${this.userId}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch Square inventory');
        }

        return response.json();
    }

    async updateSquareInventory(catalogObjectId: string, quantity: number) {
        const response = await fetch('/api/square', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: this.userId,
                changes: [{
                    type: 'ADJUSTMENT',
                    adjustment: {
                        catalog_object_id: catalogObjectId,
                        from_state: 'IN_STOCK',
                        to_state: 'IN_STOCK',
                        quantity: quantity.toString(),
                    },
                }],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update Square inventory');
        }

        return response.json();
    }
}

// Usage example:
// const apiClient = new ApiClient(user.uid);
// 
// try {
//   const products = await apiClient.getShopifyProducts();
//   console.log('Shopify products:', products);
//   
//   await apiClient.updateShopifyInventory('inventory-123', 50);
//   console.log('Inventory updated successfully');
// } catch (error) {
//   console.error('API error:', error.message);
// } 