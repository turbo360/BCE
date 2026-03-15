import Database from "better-sqlite3";
import path from "path";
import { modules, caseStudies } from "./seed-data";

const DB_PATH = path.join(process.cwd(), "data", "bce.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      cohort TEXT NOT NULL,
      submitted_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS case_studies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER NOT NULL REFERENCES modules(id),
      title TEXT NOT NULL,
      scenario TEXT NOT NULL,
      questions TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      case_study_id INTEGER NOT NULL REFERENCES case_studies(id),
      content TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, case_study_id)
    );

    CREATE TABLE IF NOT EXISTS notification_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      name TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Upsert modules from seed data (preserves user data, updates content)
  const upsertModule = db.prepare(
    "INSERT INTO modules (id, title, description) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description"
  );
  for (const m of modules) {
    upsertModule.run(m.id, m.title, m.description);
  }

  // Upsert case studies from seed data (preserves responses, updates content)
  const upsertCase = db.prepare(
    `INSERT INTO case_studies (id, module_id, title, scenario, questions, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, scenario = excluded.scenario, questions = excluded.questions, sort_order = excluded.sort_order`
  );
  // Assign stable IDs based on position so upsert works consistently
  let caseId = 1;
  for (const c of caseStudies) {
    upsertCase.run(caseId++, c.module_id, c.title, c.scenario, c.questions, c.sort_order);
  }

  return db;
}
