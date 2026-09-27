export interface Product {
    name: string
    price: string
}

// In a real system this would be a lookup against Dodo's backend.
// Hardcoded here since there's no server for this exercise.
export const CATALOG: Record<string, Product> = {
    prod_123: { name: 'Pro Plan — Annual', price: '$299.00' },
    prod_456: { name: 'Starter Plan — Monthly', price: '$19.00' },
    prod_789: { name: 'Team Plan — Annual', price: '$799.00' },
}

export function lookupProduct(productId: string): Product | null {
    return CATALOG[productId] ?? null
}