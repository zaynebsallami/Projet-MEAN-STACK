// src/app/models/category.model.ts
export interface Subcategory {
  _id: string;
  name: string;
  description?: string;
  category?: Category | string;
  productCount?: number;
}

export interface Category {
  trendingPercentage: number;
  _id: string;
  name: string;
  image?: string;
  subcategories?: Subcategory[];
  productCount?: number;
}
