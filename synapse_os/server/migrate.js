const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const Competitor = require('./models/Competitor');
require('dotenv').config();

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI;

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // Service Role Key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


async function migrate() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Fetch all competitors
        const competitors = await Competitor.find({});
        console.log(`Found ${competitors.length} competitors in MongoDB`);

        if (competitors.length === 0) {
            console.log('No data to migrate.');
            process.exit(0);
        }

        // Prepare data for Supabase
        const records = competitors.map(comp => ({
            mongo_id: comp._id.toString(),
            name: comp.name,
            scraped_data: comp.scrapedData,
            created_at: comp.createdAt
        }));

        // Insert into Supabase (using insert instead of upsert since the table is likely empty and no unique constraint on mongo_id exists yet)
        const { data, error } = await supabase
            .from('competitors')
            .insert(records);
        
        if (error) {
            console.error('Error inserting into Supabase:', error);
        } else {
            console.log(`Successfully migrated ${records.length} records!`);
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

migrate();
