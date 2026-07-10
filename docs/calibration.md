# Calibration Studio Guide

The TryonEngine provides an SDK to build internal admin tools (Calibration Studios) to easily import and tune jewelry packages without coding.

## JewelryAnalyzer (AI Anchors)
When a user uploads a new raw product image, feed it to the `JewelryAnalyzer` to auto-detect its bounding box, vertical center, and symmetry.
```typescript
const analysis = JewelryAnalyzer.analyzeImage(htmlImageElement, 'necklace');
console.log(analysis.suggestedPivot); // e.g. { x: 0.5, y: 0.05 }
```

## BatchValidator
Before deploying your catalog, validate it.
```typescript
const report = BatchValidator.validate(allPackages);
if (report.errors > 0) {
  console.error(report.details.filter(d => d.status === 'error'));
}
```
