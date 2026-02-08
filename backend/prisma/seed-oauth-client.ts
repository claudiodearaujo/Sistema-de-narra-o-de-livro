/**
 * Seed OAuth client only
 * Run with: npx ts-node prisma/seed-oauth-client.ts
 */
import 'dotenv/config';
import { Pool } from 'pg';

const DIRECT_URL = process.env.DIRECT_URL;

if (!DIRECT_URL) {
  console.error('❌ DIRECT_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({ connectionString: DIRECT_URL });

async function seedOAuthClient() {
  console.log('🔐 Seeding OAuth client...');
  
  const client = await pool.connect();
  
  try {
    // Upsert OAuth client
    await client.query(`
      INSERT INTO oauth_clients (id, client_id, name, allowed_redirect_uris, allowed_scopes, is_active, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        'livrya-writer-studio',
        'Writer Studio',
        ARRAY['http://localhost:5173/auth/callback', 'https://writer.livrya.com/auth/callback'],
        ARRAY['openid', 'profile', 'books', 'chapters', 'characters', 'speeches'],
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (client_id) DO UPDATE SET
        allowed_redirect_uris = EXCLUDED.allowed_redirect_uris,
        allowed_scopes = EXCLUDED.allowed_scopes,
        updated_at = NOW();
    `);
    
    console.log('✅ OAuth client "livrya-writer-studio" created/updated');
    
    // Verify insertion
    const result = await client.query(
      'SELECT * FROM oauth_clients WHERE client_id = $1',
      ['livrya-writer-studio']
    );
    console.log('📝 Client data:', result.rows[0]);
    
  } finally {
    client.release();
  }
}

seedOAuthClient()
  .then(() => {
    console.log('🎉 OAuth seed complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
