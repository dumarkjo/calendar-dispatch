-- ============================================================
-- AMTEC: FULL RESET of machine_instrument_defaults
-- Wipes all existing mappings and re-seeds clean data.
-- Also removes the combined 'Graduated Cylinder / Power Meter'
-- instrument from the instruments table.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Wipe all existing machine-instrument mappings
TRUNCATE TABLE machine_instrument_defaults;

-- 2. Remove the stale combined instrument if it still exists
DELETE FROM instruments WHERE instrument_name = 'Graduated Cylinder / Power Meter';

-- 3. Ensure Thermometer exists (plain, for Abaca Stripper)
INSERT INTO instruments (instrument_name)
SELECT 'Thermometer'
WHERE NOT EXISTS (SELECT 1 FROM instruments WHERE instrument_name = 'Thermometer');

-- 4. Re-seed all mappings cleanly (Graduated Cylinder and Power Meter are now separate)
INSERT INTO machine_instrument_defaults (machine_name, instrument_name) VALUES

  -- Corn Combine Harvester
  ('Corn Combine Harvester', 'Grain Moisture Meter'),
  ('Corn Combine Harvester', 'Penetrometer'),
  ('Corn Combine Harvester', 'Noise Level Meter'),
  ('Corn Combine Harvester', 'Stopwatch'),
  ('Corn Combine Harvester', 'Weighing Scale'),
  ('Corn Combine Harvester', 'Graduated Cylinder'),
  ('Corn Combine Harvester', 'Measuring Tape'),
  ('Corn Combine Harvester', 'Steel Tape'),
  ('Corn Combine Harvester', 'Caliper'),

  -- Cassava Digger
  ('Cassava Digger', 'Penetrometer'),
  ('Cassava Digger', 'Noise Level Meter'),
  ('Cassava Digger', 'Stopwatch'),
  ('Cassava Digger', 'Weighing Scale'),
  ('Cassava Digger', 'Graduated Cylinder'),
  ('Cassava Digger', 'Measuring Tape'),
  ('Cassava Digger', 'Steel Tape'),
  ('Cassava Digger', 'Caliper'),

  -- Cassava Granulator
  ('Cassava Granulator', 'Tachometer'),
  ('Cassava Granulator', 'Noise Level Meter'),
  ('Cassava Granulator', 'Stopwatch'),
  ('Cassava Granulator', 'Weighing Scale'),
  ('Cassava Granulator', 'Graduated Cylinder'),
  ('Cassava Granulator', 'Power Meter'),
  ('Cassava Granulator', 'Steel Tape'),
  ('Cassava Granulator', 'Caliper'),

  -- Multicrop Pulverizer
  ('Multicrop Pulverizer', 'Tachometer'),
  ('Multicrop Pulverizer', 'Noise Level Meter'),
  ('Multicrop Pulverizer', 'Stopwatch'),
  ('Multicrop Pulverizer', 'Weighing Scale'),
  ('Multicrop Pulverizer', 'Graduated Cylinder'),
  ('Multicrop Pulverizer', 'Power Meter'),
  ('Multicrop Pulverizer', 'Measuring Tape'),
  ('Multicrop Pulverizer', 'Caliper'),

  -- Multicrop Grater
  ('Multicrop Grater', 'Tachometer'),
  ('Multicrop Grater', 'Noise Level Meter'),
  ('Multicrop Grater', 'Stopwatch'),
  ('Multicrop Grater', 'Weighing Scale'),
  ('Multicrop Grater', 'Power Meter'),
  ('Multicrop Grater', 'Steel Tape'),
  ('Multicrop Grater', 'Caliper'),

  -- Corn Mill
  ('Corn Mill', 'Grain Moisture Meter'),
  ('Corn Mill', 'Tachometer'),
  ('Corn Mill', 'Noise Level Meter'),
  ('Corn Mill', 'Stopwatch'),
  ('Corn Mill', 'Weighing Scale'),
  ('Corn Mill', 'Graduated Cylinder'),
  ('Corn Mill', 'Steel Tape'),
  ('Corn Mill', 'Caliper'),

  -- Cacao Huller
  ('Cacao Huller', 'Grain Moisture Meter'),
  ('Cacao Huller', 'Tachometer'),
  ('Cacao Huller', 'Noise Level Meter'),
  ('Cacao Huller', 'Stopwatch'),
  ('Cacao Huller', 'Weighing Scale'),
  ('Cacao Huller', 'Graduated Cylinder'),
  ('Cacao Huller', 'Steel Tape'),
  ('Cacao Huller', 'Caliper'),

  -- Cacao Roaster
  ('Cacao Roaster', 'Tachometer'),
  ('Cacao Roaster', 'Noise Level Meter'),
  ('Cacao Roaster', 'Stopwatch'),
  ('Cacao Roaster', 'Weighing Scale'),
  ('Cacao Roaster', 'Power Meter'),
  ('Cacao Roaster', 'Steel Tape'),
  ('Cacao Roaster', 'Caliper'),

  -- Cassava Mechanical Dryer
  ('Cassava Mechanical Dryer', 'Thermometer and/or Thermocouple wires'),
  ('Cassava Mechanical Dryer', 'Hygrometer'),
  ('Cassava Mechanical Dryer', 'Air velocity meter'),
  ('Cassava Mechanical Dryer', 'Noise Level Meter'),
  ('Cassava Mechanical Dryer', 'Stopwatch'),
  ('Cassava Mechanical Dryer', 'Weighing Scale'),
  ('Cassava Mechanical Dryer', 'Power Meter'),
  ('Cassava Mechanical Dryer', 'Steel Tape'),
  ('Cassava Mechanical Dryer', 'Caliper'),

  -- WTAT
  ('WTAT', 'Penetrometer'),
  ('WTAT', 'Noise Level Meter'),
  ('WTAT', 'Stopwatch'),
  ('WTAT', 'Weighing Scale'),
  ('WTAT', 'Graduated Cylinder'),
  ('WTAT', 'Measuring Tape'),
  ('WTAT', 'Steel Tape'),
  ('WTAT', 'Caliper'),

  -- Disc Plow
  ('Disc Plow', 'Penetrometer'),
  ('Disc Plow', 'Noise Level Meter'),
  ('Disc Plow', 'Stopwatch'),
  ('Disc Plow', 'Weighing Scale'),
  ('Disc Plow', 'Graduated Cylinder'),
  ('Disc Plow', 'Measuring Tape'),
  ('Disc Plow', 'Steel Tape'),

  -- Disc Harrow
  ('Disc Harrow', 'Penetrometer'),
  ('Disc Harrow', 'Noise Level Meter'),
  ('Disc Harrow', 'Stopwatch'),
  ('Disc Harrow', 'Weighing Scale'),
  ('Disc Harrow', 'Graduated Cylinder'),
  ('Disc Harrow', 'Measuring Tape'),
  ('Disc Harrow', 'Steel Tape'),
  ('Disc Harrow', 'Caliper'),

  -- Furrower
  ('Furrower', 'Penetrometer'),
  ('Furrower', 'Noise Level Meter'),
  ('Furrower', 'Stopwatch'),
  ('Furrower', 'Weighing Scale'),
  ('Furrower', 'Graduated Cylinder'),
  ('Furrower', 'Measuring Tape'),
  ('Furrower', 'Steel Tape'),
  ('Furrower', 'Caliper'),

  -- Agricultural Trailer
  ('Agricultural Trailer', 'Noise Level Meter'),
  ('Agricultural Trailer', 'Parking brake test rig'),
  ('Agricultural Trailer', '15 deg Test ramp'),
  ('Agricultural Trailer', 'Stopwatch'),
  ('Agricultural Trailer', 'Weighing Scale'),
  ('Agricultural Trailer', 'Graduated Cylinder'),
  ('Agricultural Trailer', 'Measuring Tape'),
  ('Agricultural Trailer', 'Steel Tape'),
  ('Agricultural Trailer', 'Caliper'),

  -- Weeder
  ('Weeder', 'Noise Level Meter'),
  ('Weeder', 'Stopwatch'),
  ('Weeder', 'Weighing Scale'),
  ('Weeder', 'Graduated Cylinder'),
  ('Weeder', 'Measuring Tape'),
  ('Weeder', 'Steel Tape'),
  ('Weeder', 'Caliper'),

  -- Rice Drum Seeder
  ('Rice Drum Seeder', 'Pulse Meter'),
  ('Rice Drum Seeder', 'Noise Level Meter'),
  ('Rice Drum Seeder', 'Stopwatch'),
  ('Rice Drum Seeder', 'Weighing Scale'),
  ('Rice Drum Seeder', 'Measuring Tape'),
  ('Rice Drum Seeder', 'Steel Tape'),
  ('Rice Drum Seeder', 'Caliper'),

  -- Granular Fertilizer Applicator
  ('Granular Fertilizer Applicator', 'Noise Level Meter'),
  ('Granular Fertilizer Applicator', 'Stopwatch'),
  ('Granular Fertilizer Applicator', 'Weighing Scale'),
  ('Granular Fertilizer Applicator', 'Graduated Cylinder'),
  ('Granular Fertilizer Applicator', 'Measuring Tape'),
  ('Granular Fertilizer Applicator', 'Steel Tape'),
  ('Granular Fertilizer Applicator', 'Caliper'),

  -- Field Cultivator
  ('Field Cultivator', 'Noise Level Meter'),
  ('Field Cultivator', 'Stopwatch'),
  ('Field Cultivator', 'Weighing Scale'),
  ('Field Cultivator', 'Graduated Cylinder'),
  ('Field Cultivator', 'Measuring Tape'),
  ('Field Cultivator', 'Steel Tape'),
  ('Field Cultivator', 'Caliper'),

  -- Subsoiler
  ('Subsoiler', 'Noise Level Meter'),
  ('Subsoiler', 'Stopwatch'),
  ('Subsoiler', 'Weighing Scale'),
  ('Subsoiler', 'Graduated Cylinder'),
  ('Subsoiler', 'Measuring Tape'),
  ('Subsoiler', 'Steel Tape'),
  ('Subsoiler', 'Caliper'),

  -- Mechanical Rice Transplanter
  ('Mechanical Rice Transplanter', 'Noise Level Meter'),
  ('Mechanical Rice Transplanter', 'Stopwatch'),
  ('Mechanical Rice Transplanter', 'Weighing Scale'),
  ('Mechanical Rice Transplanter', 'Graduated Cylinder'),
  ('Mechanical Rice Transplanter', 'Measuring Tape'),
  ('Mechanical Rice Transplanter', 'Steel Tape'),
  ('Mechanical Rice Transplanter', 'Caliper'),

  -- Sugar Planter
  ('Sugar Planter', 'Penetrometer'),
  ('Sugar Planter', 'Noise Level Meter'),
  ('Sugar Planter', 'Stopwatch'),
  ('Sugar Planter', 'Weighing Scale'),
  ('Sugar Planter', 'Graduated Cylinder'),
  ('Sugar Planter', 'Power Meter'),
  ('Sugar Planter', 'Measuring Tape'),
  ('Sugar Planter', 'Steel Tape'),
  ('Sugar Planter', 'Caliper'),

  -- Soil Auger
  ('Soil Auger', 'Noise Level Meter'),
  ('Soil Auger', 'Stopwatch'),
  ('Soil Auger', 'Weighing Scale'),
  ('Soil Auger', 'Graduated Cylinder'),
  ('Soil Auger', 'Power Meter'),
  ('Soil Auger', 'Measuring Tape'),
  ('Soil Auger', 'Steel Tape'),
  ('Soil Auger', 'Caliper'),

  -- Spring Tooth Harrow
  ('Spring Tooth Harrow', 'Noise Level Meter'),
  ('Spring Tooth Harrow', 'Stopwatch'),
  ('Spring Tooth Harrow', 'Weighing Scale'),
  ('Spring Tooth Harrow', 'Graduated Cylinder'),
  ('Spring Tooth Harrow', 'Measuring Tape'),
  ('Spring Tooth Harrow', 'Steel Tape'),
  ('Spring Tooth Harrow', 'Caliper'),

  -- Granule Applicator
  ('Granule Applicator', 'Noise Level Meter'),
  ('Granule Applicator', 'Stopwatch'),
  ('Granule Applicator', 'Weighing Scale'),
  ('Granule Applicator', 'Graduated Cylinder'),
  ('Granule Applicator', 'Measuring Tape'),
  ('Granule Applicator', 'Steel Tape'),
  ('Granule Applicator', 'Caliper'),

  -- Rice Precision Seeder
  ('Rice Precision Seeder', 'Grain Moisture Meter'),
  ('Rice Precision Seeder', 'Noise Level Meter'),
  ('Rice Precision Seeder', 'Stopwatch'),
  ('Rice Precision Seeder', 'Weighing Scale'),
  ('Rice Precision Seeder', 'Graduated Cylinder'),
  ('Rice Precision Seeder', 'Measuring Tape'),
  ('Rice Precision Seeder', 'Steel Tape'),
  ('Rice Precision Seeder', 'Caliper'),

  -- Heated Air Mechanical Grain Dryer
  ('Heated Air Mechanical Grain Dryer', 'Thermometer and/or Thermocouple wires'),
  ('Heated Air Mechanical Grain Dryer', 'Grain Moisture Meter'),
  ('Heated Air Mechanical Grain Dryer', 'Tachometer'),
  ('Heated Air Mechanical Grain Dryer', 'Manometer'),
  ('Heated Air Mechanical Grain Dryer', 'Pitot Tube'),
  ('Heated Air Mechanical Grain Dryer', 'Hygrometer'),
  ('Heated Air Mechanical Grain Dryer', 'Air velocity meter'),
  ('Heated Air Mechanical Grain Dryer', 'Noise Level Meter'),
  ('Heated Air Mechanical Grain Dryer', 'Stopwatch'),
  ('Heated Air Mechanical Grain Dryer', 'Weighing Scale'),
  ('Heated Air Mechanical Grain Dryer', 'Power Meter'),
  ('Heated Air Mechanical Grain Dryer', 'Steel Tape'),
  ('Heated Air Mechanical Grain Dryer', 'Caliper'),

  -- Mechanical Rice Thresher
  ('Mechanical Rice Thresher', 'Grain Moisture Meter'),
  ('Mechanical Rice Thresher', 'Tachometer'),
  ('Mechanical Rice Thresher', 'Air velocity meter'),
  ('Mechanical Rice Thresher', 'Noise Level Meter'),
  ('Mechanical Rice Thresher', 'Stopwatch'),
  ('Mechanical Rice Thresher', 'Weighing Scale'),
  ('Mechanical Rice Thresher', 'Graduated Cylinder'),
  ('Mechanical Rice Thresher', 'Steel Tape'),
  ('Mechanical Rice Thresher', 'Caliper'),

  -- Rice Mill
  ('Rice Mill', 'Grain Moisture Meter'),
  ('Rice Mill', 'Tachometer'),
  ('Rice Mill', 'Noise Level Meter'),
  ('Rice Mill', 'Stopwatch'),
  ('Rice Mill', 'Weighing Scale'),
  ('Rice Mill', 'Graduated Cylinder'),
  ('Rice Mill', 'Power Meter'),
  ('Rice Mill', 'Steel Tape'),
  ('Rice Mill', 'Caliper'),

  -- Power-operated Corn Sheller
  ('Power-operated Corn Sheller', 'Grain Moisture Meter'),
  ('Power-operated Corn Sheller', 'Tachometer'),
  ('Power-operated Corn Sheller', 'Air velocity meter'),
  ('Power-operated Corn Sheller', 'Noise Level Meter'),
  ('Power-operated Corn Sheller', 'Stopwatch'),
  ('Power-operated Corn Sheller', 'Weighing Scale'),
  ('Power-operated Corn Sheller', 'Graduated Cylinder'),
  ('Power-operated Corn Sheller', 'Power Meter'),
  ('Power-operated Corn Sheller', 'Steel Tape'),
  ('Power-operated Corn Sheller', 'Caliper'),

  -- Rice Reaper
  ('Rice Reaper', 'Grain Moisture Meter'),
  ('Rice Reaper', 'Penetrometer'),
  ('Rice Reaper', 'Noise Level Meter'),
  ('Rice Reaper', 'Stopwatch'),
  ('Rice Reaper', 'Weighing Scale'),
  ('Rice Reaper', 'Graduated Cylinder'),
  ('Rice Reaper', 'Measuring Tape'),
  ('Rice Reaper', 'Steel Tape'),
  ('Rice Reaper', 'Caliper'),
  ('Rice Reaper', 'Sickle'),

  -- Hammer Mill
  ('Hammer Mill', 'Grain Moisture Meter'),
  ('Hammer Mill', 'Tachometer'),
  ('Hammer Mill', 'Noise Level Meter'),
  ('Hammer Mill', 'Stopwatch'),
  ('Hammer Mill', 'Weighing Scale'),
  ('Hammer Mill', 'Graduated Cylinder'),
  ('Hammer Mill', 'Power Meter'),
  ('Hammer Mill', 'Steel Tape'),
  ('Hammer Mill', 'Caliper'),

  -- Forage Chopper
  ('Forage Chopper', 'Tachometer'),
  ('Forage Chopper', 'Noise Level Meter'),
  ('Forage Chopper', 'Stopwatch'),
  ('Forage Chopper', 'Weighing Scale'),
  ('Forage Chopper', 'Graduated Cylinder'),
  ('Forage Chopper', 'Power Meter'),
  ('Forage Chopper', 'Steel Tape'),
  ('Forage Chopper', 'Caliper'),

  -- Peanut Sheller
  ('Peanut Sheller', 'Grain Moisture Meter'),
  ('Peanut Sheller', 'Tachometer'),
  ('Peanut Sheller', 'Air velocity meter'),
  ('Peanut Sheller', 'Noise Level Meter'),
  ('Peanut Sheller', 'Stopwatch'),
  ('Peanut Sheller', 'Weighing Scale'),
  ('Peanut Sheller', 'Graduated Cylinder'),
  ('Peanut Sheller', 'Power Meter'),
  ('Peanut Sheller', 'Steel Tape'),
  ('Peanut Sheller', 'Caliper'),

  -- Chipping Machine
  ('Chipping Machine', 'Tachometer'),
  ('Chipping Machine', 'Noise Level Meter'),
  ('Chipping Machine', 'Stopwatch'),
  ('Chipping Machine', 'Weighing Scale'),
  ('Chipping Machine', 'Graduated Cylinder'),
  ('Chipping Machine', 'Power Meter'),
  ('Chipping Machine', 'Sphygmomanometer'),
  ('Chipping Machine', 'Steel Tape'),
  ('Chipping Machine', 'Caliper'),

  -- Rice Combine Harvester
  ('Rice Combine Harvester', 'Grain Moisture Meter'),
  ('Rice Combine Harvester', 'Penetrometer'),
  ('Rice Combine Harvester', 'Noise Level Meter'),
  ('Rice Combine Harvester', 'Stopwatch'),
  ('Rice Combine Harvester', 'Weighing Scale'),
  ('Rice Combine Harvester', 'Graduated Cylinder'),
  ('Rice Combine Harvester', 'Measuring Tape'),
  ('Rice Combine Harvester', 'Steel Tape'),
  ('Rice Combine Harvester', 'Caliper'),

  -- Micromill
  ('Micromill', 'Grain Moisture Meter'),
  ('Micromill', 'Tachometer'),
  ('Micromill', 'Noise Level Meter'),
  ('Micromill', 'Stopwatch'),
  ('Micromill', 'Weighing Scale'),
  ('Micromill', 'Graduated Cylinder'),
  ('Micromill', 'Power Meter'),
  ('Micromill', 'Steel Tape'),
  ('Micromill', 'Caliper'),

  -- Fiber Decorticator
  ('Fiber Decorticator', 'Tachometer'),
  ('Fiber Decorticator', 'Noise Level Meter'),
  ('Fiber Decorticator', 'Stopwatch'),
  ('Fiber Decorticator', 'Weighing Scale'),
  ('Fiber Decorticator', 'Graduated Cylinder'),
  ('Fiber Decorticator', 'Steel Tape'),
  ('Fiber Decorticator', 'Caliper'),

  -- Coconut Oil Expeller
  ('Coconut Oil Expeller', 'Thermometer and/or Thermocouple wires'),
  ('Coconut Oil Expeller', 'Tachometer'),
  ('Coconut Oil Expeller', 'Noise Level Meter'),
  ('Coconut Oil Expeller', 'Stopwatch'),
  ('Coconut Oil Expeller', 'Weighing Scale'),
  ('Coconut Oil Expeller', 'Graduated Cylinder'),
  ('Coconut Oil Expeller', 'Power Meter'),
  ('Coconut Oil Expeller', 'Steel Tape'),
  ('Coconut Oil Expeller', 'Caliper'),

  -- Multicrop Juice Extractor
  ('Multicrop Juice Extractor', 'Tachometer'),
  ('Multicrop Juice Extractor', 'Noise Level Meter'),
  ('Multicrop Juice Extractor', 'Stopwatch'),
  ('Multicrop Juice Extractor', 'Weighing Scale'),
  ('Multicrop Juice Extractor', 'Graduated Cylinder'),
  ('Multicrop Juice Extractor', 'Power Meter'),
  ('Multicrop Juice Extractor', 'Steel Tape'),
  ('Multicrop Juice Extractor', 'Caliper'),

  -- Crystallizer
  ('Crystallizer', 'Tachometer'),
  ('Crystallizer', 'Noise Level Meter'),
  ('Crystallizer', 'Stopwatch'),
  ('Crystallizer', 'Weighing Scale'),
  ('Crystallizer', 'Graduated Cylinder'),
  ('Crystallizer', 'Power Meter'),
  ('Crystallizer', 'Steel Tape'),
  ('Crystallizer', 'Caliper'),

  -- Multicrop Micromill
  ('Multicrop Micromill', 'Tachometer'),
  ('Multicrop Micromill', 'Noise Level Meter'),
  ('Multicrop Micromill', 'Stopwatch'),
  ('Multicrop Micromill', 'Weighing Scale'),
  ('Multicrop Micromill', 'Graduated Cylinder'),
  ('Multicrop Micromill', 'Power Meter'),
  ('Multicrop Micromill', 'Steel Tape'),
  ('Multicrop Micromill', 'Caliper'),

  -- Biomass Furnace
  ('Biomass Furnace', 'Thermometer and/or Thermocouple wires'),
  ('Biomass Furnace', 'Grain Moisture Meter'),
  ('Biomass Furnace', 'Air velocity meter'),
  ('Biomass Furnace', 'Noise Level Meter'),
  ('Biomass Furnace', 'Stopwatch'),
  ('Biomass Furnace', 'Weighing Scale'),
  ('Biomass Furnace', 'Steel Tape'),
  ('Biomass Furnace', 'Caliper'),

  -- Biomass Shredder
  ('Biomass Shredder', 'Tachometer'),
  ('Biomass Shredder', 'Noise Level Meter'),
  ('Biomass Shredder', 'Stopwatch'),
  ('Biomass Shredder', 'Weighing Scale'),
  ('Biomass Shredder', 'Graduated Cylinder'),
  ('Biomass Shredder', 'Power Meter'),
  ('Biomass Shredder', 'Psychrometer'),
  ('Biomass Shredder', 'Steel Tape'),
  ('Biomass Shredder', 'Caliper'),
  ('Biomass Shredder', 'Catching net'),

  -- Dehusked Corn Dryer
  ('Dehusked Corn Dryer', 'Thermometer and/or Thermocouple wires'),
  ('Dehusked Corn Dryer', 'Grain Moisture Meter'),
  ('Dehusked Corn Dryer', 'Tachometer'),
  ('Dehusked Corn Dryer', 'Manometer'),
  ('Dehusked Corn Dryer', 'Pitot Tube'),
  ('Dehusked Corn Dryer', 'Hygrometer'),
  ('Dehusked Corn Dryer', 'Air velocity meter'),
  ('Dehusked Corn Dryer', 'Noise Level Meter'),
  ('Dehusked Corn Dryer', 'Stopwatch'),
  ('Dehusked Corn Dryer', 'Weighing Scale'),
  ('Dehusked Corn Dryer', 'Power Meter'),
  ('Dehusked Corn Dryer', 'Steel Tape'),
  ('Dehusked Corn Dryer', 'Caliper'),

  -- Fruit Dryer
  ('Fruit Dryer', 'Thermometer and/or Thermocouple wires'),
  ('Fruit Dryer', 'Grain Moisture Meter'),
  ('Fruit Dryer', 'Tachometer'),
  ('Fruit Dryer', 'Manometer'),
  ('Fruit Dryer', 'Pitot Tube'),
  ('Fruit Dryer', 'Hygrometer'),
  ('Fruit Dryer', 'Air velocity meter'),
  ('Fruit Dryer', 'Noise Level Meter'),
  ('Fruit Dryer', 'Stopwatch'),
  ('Fruit Dryer', 'Weighing Scale'),
  ('Fruit Dryer', 'Power Meter'),
  ('Fruit Dryer', 'Steel Tape'),
  ('Fruit Dryer', 'Caliper'),

  -- Coconut Coir Decorticator
  ('Coconut Coir Decorticator', 'Tachometer'),
  ('Coconut Coir Decorticator', 'Noise Level Meter'),
  ('Coconut Coir Decorticator', 'Stopwatch'),
  ('Coconut Coir Decorticator', 'Weighing Scale'),
  ('Coconut Coir Decorticator', 'Graduated Cylinder'),
  ('Coconut Coir Decorticator', 'Power Meter'),
  ('Coconut Coir Decorticator', 'Psychrometer'),
  ('Coconut Coir Decorticator', 'Steel Tape'),
  ('Coconut Coir Decorticator', 'Caliper'),

  -- Coffee Pulper
  ('Coffee Pulper', 'Tachometer'),
  ('Coffee Pulper', 'Noise Level Meter'),
  ('Coffee Pulper', 'Stopwatch'),
  ('Coffee Pulper', 'Weighing Scale'),
  ('Coffee Pulper', 'Graduated Cylinder'),
  ('Coffee Pulper', 'Power Meter'),
  ('Coffee Pulper', 'Psychrometer'),
  ('Coffee Pulper', 'Sphygmomanometer'),
  ('Coffee Pulper', 'Steel Tape'),
  ('Coffee Pulper', 'Caliper'),

  -- Abaca Stripper
  ('Abaca Stripper', 'Thermometer'),
  ('Abaca Stripper', 'Tachometer'),
  ('Abaca Stripper', 'Noise Level Meter'),
  ('Abaca Stripper', 'Stopwatch'),
  ('Abaca Stripper', 'Weighing Scale'),
  ('Abaca Stripper', 'Graduated Cylinder'),
  ('Abaca Stripper', 'Power Meter'),
  ('Abaca Stripper', 'Psychrometer'),
  ('Abaca Stripper', 'Sphygmomanometer'),
  ('Abaca Stripper', 'Steel Tape'),
  ('Abaca Stripper', 'Caliper'),

  -- Corn Picker
  ('Corn Picker', 'Tachometer'),
  ('Corn Picker', 'Noise Level Meter'),
  ('Corn Picker', 'Stopwatch'),
  ('Corn Picker', 'Weighing Scale'),
  ('Corn Picker', 'Graduated Cylinder'),
  ('Corn Picker', 'Power Meter'),
  ('Corn Picker', 'Steel Tape'),
  ('Corn Picker', 'Caliper'),

  -- Feed Mixer
  ('Feed Mixer', 'Tachometer'),
  ('Feed Mixer', 'Noise Level Meter'),
  ('Feed Mixer', 'Stopwatch'),
  ('Feed Mixer', 'Weighing Scale'),
  ('Feed Mixer', 'Graduated Cylinder'),
  ('Feed Mixer', 'Power Meter'),
  ('Feed Mixer', 'Psychrometer'),
  ('Feed Mixer', 'Grain probe'),
  ('Feed Mixer', 'Steel Tape'),
  ('Feed Mixer', 'Caliper'),

  -- Feed Mill
  ('Feed Mill', 'Tachometer'),
  ('Feed Mill', 'Noise Level Meter'),
  ('Feed Mill', 'Stopwatch'),
  ('Feed Mill', 'Weighing Scale'),
  ('Feed Mill', 'Graduated Cylinder'),
  ('Feed Mill', 'Steel Tape'),
  ('Feed Mill', 'Caliper'),

  -- Paddy Cleaner
  ('Paddy Cleaner', 'Grain Moisture Meter'),
  ('Paddy Cleaner', 'Tachometer'),
  ('Paddy Cleaner', 'Air velocity meter'),
  ('Paddy Cleaner', 'Noise Level Meter'),
  ('Paddy Cleaner', 'Stopwatch'),
  ('Paddy Cleaner', 'Weighing Scale'),
  ('Paddy Cleaner', 'Power Meter'),
  ('Paddy Cleaner', 'Bulk density meter'),
  ('Paddy Cleaner', 'Steel Tape'),
  ('Paddy Cleaner', 'Caliper'),

  -- Multipurpose Thresher
  ('Multipurpose Thresher', 'Grain Moisture Meter'),
  ('Multipurpose Thresher', 'Tachometer'),
  ('Multipurpose Thresher', 'Air velocity meter'),
  ('Multipurpose Thresher', 'Noise Level Meter'),
  ('Multipurpose Thresher', 'Stopwatch'),
  ('Multipurpose Thresher', 'Weighing Scale'),
  ('Multipurpose Thresher', 'Graduated Cylinder'),
  ('Multipurpose Thresher', 'Power Meter'),
  ('Multipurpose Thresher', 'Steel Tape'),
  ('Multipurpose Thresher', 'Caliper'),

  -- Rice Husk Fed Heating System
  ('Rice Husk Fed Heating System', 'Thermometer and/or Thermocouple wires'),
  ('Rice Husk Fed Heating System', 'Air velocity meter'),
  ('Rice Husk Fed Heating System', 'Noise Level Meter'),
  ('Rice Husk Fed Heating System', 'Stopwatch'),
  ('Rice Husk Fed Heating System', 'Weighing Scale'),
  ('Rice Husk Fed Heating System', 'Power Meter'),
  ('Rice Husk Fed Heating System', 'Steel Tape'),
  ('Rice Husk Fed Heating System', 'Caliper'),

  -- Peanut Thresher
  ('Peanut Thresher', 'Tachometer'),
  ('Peanut Thresher', 'Air velocity meter'),
  ('Peanut Thresher', 'Noise Level Meter'),
  ('Peanut Thresher', 'Stopwatch'),
  ('Peanut Thresher', 'Weighing Scale'),
  ('Peanut Thresher', 'Graduated Cylinder'),
  ('Peanut Thresher', 'Power Meter'),
  ('Peanut Thresher', 'Steel Tape'),
  ('Peanut Thresher', 'Caliper'),

  -- Green Coffee Sorter
  ('Green Coffee Sorter', 'Tachometer'),
  ('Green Coffee Sorter', 'Air velocity meter'),
  ('Green Coffee Sorter', 'Noise Level Meter'),
  ('Green Coffee Sorter', 'Stopwatch'),
  ('Green Coffee Sorter', 'Weighing Scale'),
  ('Green Coffee Sorter', 'Graduated Cylinder'),
  ('Green Coffee Sorter', 'Power Meter'),
  ('Green Coffee Sorter', 'Steel Tape'),
  ('Green Coffee Sorter', 'Caliper'),

  -- SPIS
  ('SPIS', 'Pyranometer'),
  ('SPIS', 'Thermometer and/or Thermocouple wires'),
  ('SPIS', 'Stopwatch'),
  ('SPIS', 'Power Meter'),
  ('SPIS', 'Measuring Tape'),
  ('SPIS', 'Steel Tape'),
  ('SPIS', 'Caliper'),
  ('SPIS', 'Hygrometer'),

  -- Extruder
  ('Extruder', 'Tachometer'),
  ('Extruder', 'Noise Level Meter'),
  ('Extruder', 'Stopwatch'),
  ('Extruder', 'Weighing Scale'),
  ('Extruder', 'Graduated Cylinder'),
  ('Extruder', 'Steel Tape'),
  ('Extruder', 'Caliper'),

  -- Turbine
  ('Turbine', 'Tachometer'),
  ('Turbine', 'Multimeter'),
  ('Turbine', 'Stopwatch'),
  ('Turbine', 'Current meter'),
  ('Turbine', 'Long tape'),
  ('Turbine', 'Steel Tape'),
  ('Turbine', 'Caliper')

ON CONFLICT (machine_name, instrument_name) DO NOTHING;
