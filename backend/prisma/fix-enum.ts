import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function fix() {
    await pool.query("ALTER TYPE \"AuditAction\" ADD VALUE IF NOT EXISTS 'SYSTEM_MAINTENANCE'");
    console.log('✅ SYSTEM_MAINTENANCE adicionado ao enum AuditAction');
    await pool.end();
}

fix().catch(e => { console.error('❌', e.message); pool.end(); process.exit(1); });
