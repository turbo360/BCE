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
  `);

  // Seed modules if empty
  const moduleCount = db.prepare("SELECT COUNT(*) as count FROM modules").get() as { count: number };
  if (moduleCount.count === 0) {
    const insertModule = db.prepare("INSERT INTO modules (id, title, description) VALUES (?, ?, ?)");
    for (const m of modules) {
      insertModule.run(m.id, m.title, m.description);
    }
  }

  // Seed case studies if empty
  const caseCount = db.prepare("SELECT COUNT(*) as count FROM case_studies").get() as { count: number };
  if (caseCount.count === 0) {
    const insertCase = db.prepare(
      "INSERT INTO case_studies (module_id, title, scenario, questions, sort_order) VALUES (?, ?, ?, ?, ?)"
    );
    for (const c of caseStudies) {
      insertCase.run(c.module_id, c.title, c.scenario, c.questions, c.sort_order);
    }
  }

  return db;
}
