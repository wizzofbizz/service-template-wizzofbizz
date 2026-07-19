
import type { Service } from "@shared/schema";

export interface Material {
  name: string;
  cost: number;
  showSeparately: boolean;
  category?: string;
}

export interface MaterialCostConfig {
  variableMaterials?: Record<string, Record<string, Material[]>>;
  fixedMaterials?: Material[];
  conditionalMaterials?: Record<string, Material[]>;
}

export interface ResolvedMaterials {
  separateItems: Array<{ description: string; amount: number }>;
  bundledItems: Array<{ description: string; amount: number }>;
  bundledTotal: number;
  allMaterials: Material[];
}

export class MaterialResolver {
  /**
   * Resolve materials based on service configuration and mapped variables
   */
  static resolveMaterials(
    service: Service,
    mappedVariables: Record<string, any>,
    conditions: Record<string, boolean> = {}
  ): ResolvedMaterials {
    const config = (service.materialCostConfig as MaterialCostConfig) || {};
    const allMaterials: Material[] = [];

    // 1. Resolve variable-based materials (from customer answers)
    if (config.variableMaterials) {
      for (const [variableName, optionsMap] of Object.entries(config.variableMaterials)) {
        const selectedValue = mappedVariables[variableName];
        
        if (selectedValue && optionsMap[selectedValue]) {
          const materials = optionsMap[selectedValue];
          allMaterials.push(...materials);
          console.log(`📦 Variable Materials for ${variableName}=${selectedValue}:`, materials);
        }
      }
    }

    // 2. Add fixed materials (always included)
    if (config.fixedMaterials && config.fixedMaterials.length > 0) {
      allMaterials.push(...config.fixedMaterials);
      console.log(`📦 Fixed Materials:`, config.fixedMaterials);
    }

    // 3. Add conditional materials (based on conditions)
    if (config.conditionalMaterials) {
      for (const [conditionKey, materials] of Object.entries(config.conditionalMaterials)) {
        if (conditions[conditionKey] === true) {
          allMaterials.push(...materials);
          console.log(`📦 Conditional Materials for ${conditionKey}:`, materials);
        }
      }
    }

    // 4. Group materials by showSeparately flag
    return this.groupMaterials(allMaterials);
  }

  /**
   * Group materials into separate and bundled items
   */
  private static groupMaterials(materials: Material[]): ResolvedMaterials {
    const separateItems: Array<{ description: string; amount: number }> = [];
    const bundledItems: Array<{ description: string; amount: number }> = [];
    let bundledTotal = 0;

    for (const material of materials) {
      if (material.showSeparately) {
        separateItems.push({
          description: material.name,
          amount: material.cost,
        });
      } else {
        bundledItems.push({
          description: material.name,
          amount: material.cost,
        });
        bundledTotal += material.cost;
      }
    }

    console.log(`✅ Grouped Materials:`, {
      separateCount: separateItems.length,
      bundledCount: bundledItems.length,
      bundledTotal,
    });

    return {
      separateItems,
      bundledItems,
      bundledTotal,
      allMaterials: materials,
    };
  }

  /**
   * Calculate total material cost
   */
  static calculateTotalMaterialCost(materials: Material[]): number {
    return materials.reduce((sum, material) => sum + material.cost, 0);
  }

  /**
   * Validate material cost configuration
   */
  static validateConfig(config: MaterialCostConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate variable materials
    if (config.variableMaterials) {
      for (const [variableName, optionsMap] of Object.entries(config.variableMaterials)) {
        for (const [optionValue, materials] of Object.entries(optionsMap)) {
          if (!Array.isArray(materials)) {
            errors.push(`variableMaterials.${variableName}.${optionValue} must be an array`);
          } else {
            materials.forEach((material, index) => {
              if (!material.name || typeof material.name !== 'string') {
                errors.push(`variableMaterials.${variableName}.${optionValue}[${index}].name is required`);
              }
              if (typeof material.cost !== 'number' || material.cost < 0) {
                errors.push(`variableMaterials.${variableName}.${optionValue}[${index}].cost must be a positive number`);
              }
              if (typeof material.showSeparately !== 'boolean') {
                errors.push(`variableMaterials.${variableName}.${optionValue}[${index}].showSeparately must be a boolean`);
              }
            });
          }
        }
      }
    }

    // Validate fixed materials
    if (config.fixedMaterials) {
      if (!Array.isArray(config.fixedMaterials)) {
        errors.push('fixedMaterials must be an array');
      } else {
        config.fixedMaterials.forEach((material, index) => {
          if (!material.name || typeof material.name !== 'string') {
            errors.push(`fixedMaterials[${index}].name is required`);
          }
          if (typeof material.cost !== 'number' || material.cost < 0) {
            errors.push(`fixedMaterials[${index}].cost must be a positive number`);
          }
          if (typeof material.showSeparately !== 'boolean') {
            errors.push(`fixedMaterials[${index}].showSeparately must be a boolean`);
          }
        });
      }
    }

    // Validate conditional materials
    if (config.conditionalMaterials) {
      for (const [conditionKey, materials] of Object.entries(config.conditionalMaterials)) {
        if (!Array.isArray(materials)) {
          errors.push(`conditionalMaterials.${conditionKey} must be an array`);
        } else {
          materials.forEach((material, index) => {
            if (!material.name || typeof material.name !== 'string') {
              errors.push(`conditionalMaterials.${conditionKey}[${index}].name is required`);
            }
            if (typeof material.cost !== 'number' || material.cost < 0) {
              errors.push(`conditionalMaterials.${conditionKey}[${index}].cost must be a positive number`);
            }
            if (typeof material.showSeparately !== 'boolean') {
              errors.push(`conditionalMaterials.${conditionKey}[${index}].showSeparately must be a boolean`);
            }
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
