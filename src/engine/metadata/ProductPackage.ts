import { JewelryMetadata } from "./JewelryMetadata";

export interface ProductPackageManifest {
  version: string;
  id: string;
  title?: string;
  category: string; // 'necklace' | 'earrings' | etc
  subcategory: string;
  assets: {
    diffuse: string;
    shadow?: string;
    mask?: string;
    thumbnail?: string;
  };
}

export interface ProductPackage {
  manifest: ProductPackageManifest;
  calibration: Partial<JewelryMetadata>;
}
