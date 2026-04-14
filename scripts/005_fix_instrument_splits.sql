-- ============================================================
-- AMTEC: Fix combined instrument entries
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. For every machine that had 'Graduated Cylinder / Power Meter',
--    insert both 'Graduated Cylinder' and 'Power Meter' separately.
INSERT INTO machine_instrument_defaults (machine_name, instrument_name)
SELECT machine_name, unnest(ARRAY['Graduated Cylinder', 'Power Meter'])
FROM machine_instrument_defaults
WHERE instrument_name = 'Graduated Cylinder / Power Meter'
ON CONFLICT (machine_name, instrument_name) DO NOTHING;

-- 2. Remove the combined entry from the defaults table.
DELETE FROM machine_instrument_defaults
WHERE instrument_name = 'Graduated Cylinder / Power Meter';

-- 3. Remove the combined instrument from the instruments table.
DELETE FROM instruments
WHERE instrument_name = 'Graduated Cylinder / Power Meter';

-- 4. Remove 'Thermometer and/or Thermocouple wires' from instruments list 
--    (it stays in machine_instrument_defaults as-is — those machines need both types)
--    Just ensure plain 'Thermometer' exists for Abaca Stripper lookup.
INSERT INTO instruments (instrument_name)
SELECT 'Thermometer'
WHERE NOT EXISTS (
  SELECT 1 FROM instruments WHERE instrument_name = 'Thermometer'
);

-- Confirm
SELECT instrument_name FROM instruments ORDER BY instrument_name;
