export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  inStock: boolean;
  sku?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod_eggs_30',
    name: 'Standard Tray (30 eggs)',
    description: 'Grade AA eggs with clean shells, firm whites, and golden yolks. Intended for everyday household cooking.',
    price: 450,
    unit: 'tray (30 eggs)',
    image: '/images/fresh-eggs.jpg',
    inStock: true,
    sku: 'EGGS_30'
  },
  {
    id: 'prod_eggs_60',
    name: 'Large Tray (60 eggs)',
    description: 'Double the quantity for families, cafes, and business kitchens.',
    price: 850,
    unit: 'tray (60 eggs)',
    image: '/images/large-tray.jpg',
    inStock: true,
    sku: 'EGGS_60'
  }
];
