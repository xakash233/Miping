-- Add category and language to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'MARKETING',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en_US';
