import { ProductPackage } from "../metadata/ProductPackage";
import {
  JewelryMetadata,
  DEFAULT_ANCHORS,
  DEFAULT_PERSPECTIVE,
  DEFAULT_LIGHTING,
  DEFAULT_CALIBRATION,
  DEFAULT_TRACKING_REQUIREMENTS,
  JewelryCategory,
  JewelrySubcategory,
} from "../metadata/JewelryMetadata";
import { assetManager } from "./AssetManager";

export class PackageLoader {
  /**
   * Parses a ProductPackage and converts it into standard JewelryMetadata,
   * while preloading the images into the AssetManager.
   */
  static async load(
    pkg: ProductPackage,
    baseUrl = "",
  ): Promise<JewelryMetadata> {
    const manifest = pkg.manifest;
    const cal = pkg.calibration;

    const category = manifest.category as JewelryCategory;

    // Construct strict metadata
    const metadata: JewelryMetadata = {
      id: manifest.id,
      category,
      subcategory: manifest.subcategory as JewelrySubcategory,
      image: baseUrl + manifest.assets.diffuse,
      mask: manifest.assets.mask ? baseUrl + manifest.assets.mask : undefined,
      shadow: manifest.assets.shadow
        ? baseUrl + manifest.assets.shadow
        : undefined,
      thumbnail: manifest.assets.thumbnail
        ? baseUrl + manifest.assets.thumbnail
        : undefined,

      anchors: cal.anchors ?? { ...DEFAULT_ANCHORS[category] },

      defaultScale: cal.defaultScale ?? 1.0,
      minScale: cal.minScale ?? 0.5,
      maxScale: cal.maxScale ?? 2.0,
      rotationOffset: cal.rotationOffset ?? 0,

      perspectiveCompression: cal.perspectiveCompression ?? {
        ...DEFAULT_PERSPECTIVE,
      },
      lighting: cal.lighting ?? { ...DEFAULT_LIGHTING },

      shadowSpec: cal.shadowSpec,
      reflectionSpec: cal.reflectionSpec,
      postProcess: cal.postProcess,
      reflection: cal.reflection ?? false,

      renderOrder: cal.renderOrder ?? 0,
      qualityLevel: cal.qualityLevel ?? "standard",
      trackingRequirements: cal.trackingRequirements ?? {
        ...DEFAULT_TRACKING_REQUIREMENTS[category],
      },
      calibration: cal.calibration ?? { ...DEFAULT_CALIBRATION },

      pendant: cal.pendant,
      necklace: cal.necklace,
      earring: cal.earring,

      ringFinger: cal.ringFinger,
      preferredHand: cal.preferredHand,
    };

    // Begin preload
    assetManager.ensure(
      metadata.id,
      metadata.image,
      metadata.mask,
      metadata.shadow,
    );

    return metadata;
  }
}
