import { ProductPackage } from "../metadata/ProductPackage";

export interface ValidationReport {
  passed: number;
  warnings: number;
  errors: number;
  details: Array<{
    id: string;
    status: "pass" | "warn" | "error";
    messages: string[];
  }>;
}

export class BatchValidator {
  static validate(packages: ProductPackage[]): ValidationReport {
    const report: ValidationReport = {
      passed: 0,
      warnings: 0,
      errors: 0,
      details: [],
    };

    for (const pkg of packages) {
      const messages: string[] = [];
      let hasError = false;
      let hasWarn = false;

      const manifest = pkg.manifest;

      if (!manifest.id || !manifest.category) {
        hasError = true;
        messages.push("Missing required manifest fields (id, category).");
      }

      if (!manifest.assets || !manifest.assets.diffuse) {
        hasError = true;
        messages.push("Missing required diffuse asset.");
      }

      if (!pkg.calibration) {
        hasWarn = true;
        messages.push("No calibration object provided; defaults will be used.");
      } else {
        if (pkg.calibration.defaultScale && pkg.calibration.defaultScale <= 0) {
          hasError = true;
          messages.push("defaultScale must be > 0.");
        }

        if (
          pkg.calibration.shadowSpec &&
          pkg.calibration.shadowSpec.blur > 50
        ) {
          hasWarn = true;
          messages.push(
            "Extremely high shadow blur detected; this will severely impact mobile performance.",
          );
        }

        if (manifest.category === "pendant" && !pkg.calibration.pendant) {
          hasError = true;
          messages.push(
            "Pendant category requires pendant physics/metrics calibration block.",
          );
        }
      }

      let status: "pass" | "warn" | "error" = "pass";
      if (hasError) {
        status = "error";
        report.errors++;
      } else if (hasWarn) {
        status = "warn";
        report.warnings++;
      } else {
        report.passed++;
      }

      report.details.push({
        id: manifest.id || "unknown",
        status,
        messages,
      });
    }

    return report;
  }
}
