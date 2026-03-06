import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcrypt";

const dbPath = path.join(process.cwd(), "repository.db");
const db = new Database(dbPath);

// ========================
// 1) CREATE TABLES
// ========================
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  avatar TEXT,

  -- profile fields
  userCode TEXT,
  firstName TEXT,
  middleName TEXT,
  lastName TEXT,
  suffix TEXT,
  birthdate TEXT,
  employmentType TEXT,

  contact TEXT,
  department TEXT,
  position TEXT,

  createdAt TEXT,
  mustChangePassword INTEGER DEFAULT 0
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fileId TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,

  -- ✅ filing structure
  category TEXT NOT NULL,        -- Academe / Stakeholder
  folder TEXT,                  -- stakeholder name OR academe group/school/project
  title TEXT,                   -- document title (manual)
  dateReceived TEXT,            -- YYYY-MM-DD

  year TEXT NOT NULL,
  uploadedAt TEXT NOT NULL
)
`).run();

// ========================
// 2) MIGRATIONS (safe ALTER)
// ========================
function addColumnSafe(sql: string) {
  try {
    db.prepare(sql).run();
  } catch {
    // ignore if already exists
  }
}

// USERS old fields
addColumnSafe(`ALTER TABLE users ADD COLUMN contact TEXT`);
addColumnSafe(`ALTER TABLE users ADD COLUMN department TEXT`);
addColumnSafe(`ALTER TABLE users ADD COLUMN position TEXT`);
addColumnSafe(`ALTER TABLE users ADD COLUMN createdAt TEXT`);
addColumnSafe(`ALTER TABLE users ADD COLUMN mustChangePassword INTEGER DEFAULT 0`);

// USERS new fields for register
addColumnSafe(`ALTER TABLE users ADD COLUMN userCode TEXT`);
addColumnSafe(`ALTER TABLE users ADD COLUMN firstName TEXT`);
addColumnSafe(`ALTER TABLE users ADD COLUMN middleName TEXT`);
addColumnSafe(`ALTER TABLE users ADD COLUMN lastName TEXT`);
addColumnSafe(`ALTER TABLE users ADD COLUMN suffix TEXT`);
addColumnSafe(`ALTER TABLE users ADD COLUMN birthdate TEXT`);
addColumnSafe(`ALTER TABLE users ADD COLUMN employmentType TEXT`);

// DOCUMENTS extra fields (for new upload filing)
addColumnSafe(`ALTER TABLE documents ADD COLUMN title TEXT`);
addColumnSafe(`ALTER TABLE documents ADD COLUMN dateReceived TEXT`);
addColumnSafe(`ALTER TABLE documents ADD COLUMN folder TEXT`);

// ========================
// 3) AUTO CREATE ADMIN
// ========================
const adminEmail = "mthamiguitan@denr.gov.ph";
const adminPassword = "MHRWS9303";
const adminEmploymentType = "Permanent";

const adminExists = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get(adminEmail) as any;

if (!adminExists) {
  const hashed = bcrypt.hashSync(adminPassword, 10);
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (
      name, email, password, role,
      employmentType,
      createdAt, mustChangePassword
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    "MHRWS Admin",
    adminEmail,
    hashed,
    "admin",
    adminEmploymentType,
    createdAt,
    0
  );
}

// always ensure admin role
db.prepare(`UPDATE users SET role = 'admin' WHERE email = ?`).run(adminEmail);

// ensure admin employmentType (if existing row old/NULL)
db.prepare(`
  UPDATE users
  SET employmentType = COALESCE(NULLIF(employmentType,''), ?)
  WHERE email = ?
`).run(adminEmploymentType, adminEmail);

// ✅ OPTIONAL: set default employmentType for old staff rows (para mo work dayon filter)
// If ayaw nimo i-auto set, comment out ni:
// db.prepare(`
//   UPDATE users
//   SET employmentType = COALESCE(NULLIF(employmentType,''), 'Job Order')
//   WHERE role = 'staff'
// `).run();

export default db;