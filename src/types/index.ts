export interface Product {
  id: number;
  stock: number;
  sku: string;
  ean: string;
  title: string;
  description: string;
  specs: string;
  characteristics: string;
  price: number;
  mainImg: string;
  galleryImgs: string;
  categorie: number;
  weight: number;
  discount: number;
}

export interface Filter {
  id: number;
  categoryId: number;
  name: string;
}

export interface WeightPrice {
  id: number;
  firstNumber: number;
  secondNumber: number;
  price: number;
}

export interface Category {
  id: number;
  parentId: number;
  name: string;
}

interface Adress {
  city: string;
  line1: string;
  line2?: string | null;
  postal_code: string;
  state: string;
  country: string;
};

export interface Order {
  id: number;
  products: string;
  status: string;
  price: number;
  adress: Adress;
  email: string;
  date: string;
  token: string;
  metaid: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
}
