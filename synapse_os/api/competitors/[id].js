import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Competitor ID is required' });
  }

  const platform = req.query.platform || 'instagram';
  const tableName = platform === 'linkedin' ? 'linkedin_competitors' : 'competitors';

  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ message: 'Competitor deleted successfully' });
  } catch (error) {
    console.error('Error deleting competitor:', error);
    return res.status(500).json({ error: 'Failed to delete competitor' });
  }
}
