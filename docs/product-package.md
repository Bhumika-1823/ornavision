# Product Package Specification

The engine ingests jewelry through standardized JSON payloads.

```json
{
  "manifest": {
    "version": "1.0",
    "id": "gold-choker-01",
    "category": "necklace",
    "subcategory": "choker",
    "assets": {
      "diffuse": "/assets/choker_diffuse.webp",
      "shadow": "/assets/choker_shadow.webp"
    }
  },
  "calibration": {
    "defaultScale": 1.1,
    "reflectionSpec": {
      "mode": "gold",
      "intensity": 0.3
    }
  }
}
```

## Manifest Requirements
- `assets.diffuse` must be a transparent `.webp` or `.png`.
- `category` must be one of `['necklace', 'earrings', 'ring', 'bracelet', 'pendant']`.

## Loading a Package
Use the `PackageLoader` to seamlessly deserialize the JSON and preload assets:
```typescript
const meta = await PackageLoader.load(myPackageJson, "https://cdn.my-site.com");
```
