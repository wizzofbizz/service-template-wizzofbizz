
-- Add material_cost_config column to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS material_cost_config JSONB DEFAULT '{}'::jsonb;

-- Update existing rows to have the default empty object
UPDATE services 
SET material_cost_config = '{}'::jsonb 
WHERE material_cost_config IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN services.material_cost_config IS 'Material cost configuration: variableMaterials (tied to service questions), fixedMaterials (always included), conditionalMaterials (based on conditions)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Material Cost Config Migration Complete';
    RAISE NOTICE 'Added material_cost_config column to services table';
END $$;
