/**
 * database.js — SQLite database layer for Squadify
 *
 * Uses expo-sqlite v16 async API (openDatabaseAsync, execAsync, runAsync,
 * getFirstAsync, getAllAsync). This is the only correct API for SDK 54 —
 * never use the legacy synchronous API.
 *
 * All database logic lives here. Screens import these functions and never
 * interact with SQLite directly — this keeps the data layer isolated and
 * easy to maintain.
 */

import * as SQLite from 'expo-sqlite';
import { nowISO } from '../utils/format';

// Singleton database connection — opened once and reused across all calls
let _db = null;

/**
 * Returns the open database connection, creating it on first call.
 * WAL (Write-Ahead Logging) mode improves concurrent read performance.
 */
async function getDB() {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('squadify.db');
    await _db.execAsync('PRAGMA journal_mode = WAL;');
  }
  return _db;
}

// ─── Initialise ───────────────────────────────────────────────────────────────

/**
 * Creates all tables if they don't exist and seeds default settings.
 * Called once on app startup in App.js before rendering the UI.
 *
 * Tables:
 *   members          — team member profiles and balances
 *   sessions         — training/match sessions
 *   session_attendance — which members attended each session
 *   settings         — key/value app configuration store
 */
export async function initDB() {
  const db = await getDB();

  // Create all tables in a single transaction for efficiency
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS members (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name  TEXT NOT NULL,
      position   TEXT,
      sport      TEXT DEFAULT '',
      balance    REAL DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT,
      date       TEXT,
      location   TEXT,
      fee        REAL,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS session_attendance (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      member_id  INTEGER,
      present    INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Add sport column to existing members table when upgrading from v1
  // ALTER TABLE fails silently if the column already exists
  try {
    await db.execAsync('ALTER TABLE members ADD COLUMN sport TEXT DEFAULT ""');
  } catch (_) {}

  // Seed default settings — only inserted if the key doesn't already exist
  const defaults = [
    ['fee', '5.00'],
    ['team_name', 'My Team'],
    ['season', 'Season 1'],
    ['export_path', '/Documents/Squadify/'],
    ['sports_list', 'Volleyball,Football,Badminton'],
  ];
  for (const [key, value] of defaults) {
    const existing = await db.getFirstAsync(
      'SELECT value FROM settings WHERE key = ?', [key]
    );
    if (!existing) {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]
      );
    }
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/**
 * Retrieves a single setting value by key.
 * @param {string} key - Setting key (e.g. 'fee', 'team_name')
 * @returns {string|null} Setting value or null if not found
 */
export async function getSetting(key) {
  const db = await getDB();
  const row = await db.getFirstAsync(
    'SELECT value FROM settings WHERE key = ?', [key]
  );
  return row ? row.value : null;
}

/**
 * Saves a setting value. Inserts if new, updates if existing (upsert).
 * @param {string} key - Setting key
 * @param {string|number} value - Setting value (converted to string)
 */
export async function setSetting(key, value) {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, String(value)]
  );
}

/**
 * Returns all settings as a plain object { key: value }.
 * Used by screens that need multiple settings at once.
 */
export async function getAllSettings() {
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT key, value FROM settings');
  const result = {};
  rows.forEach(r => { result[r.key] = r.value; });
  return result;
}

// ─── Members ──────────────────────────────────────────────────────────────────

/**
 * Returns all members sorted alphabetically by last name, then first name.
 */
export async function getAllMembers() {
  const db = await getDB();
  return await db.getAllAsync(
    'SELECT * FROM members ORDER BY last_name ASC, first_name ASC'
  );
}

/**
 * Returns a single member by ID, or null if not found.
 */
export async function getMemberById(id) {
  const db = await getDB();
  return await db.getFirstAsync(
    'SELECT * FROM members WHERE id = ?', [id]
  );
}

/**
 * Inserts a new member into the database.
 * Sets both created_at and updated_at to the current timestamp.
 * @returns {number} The new member's ID
 */
export async function insertMember({ first_name, last_name, position, sport, balance }) {
  const db = await getDB();
  const now = nowISO();
  const result = await db.runAsync(
    `INSERT INTO members
     (first_name, last_name, position, sport, balance, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [first_name, last_name, position || '', sport || '',
     parseFloat(balance) || 0, now, now]
  );
  return result.lastInsertRowId;
}

/**
 * Updates a member's profile fields (name, position, sport).
 * Does not update balance — use adjustMemberBalance for that.
 */
export async function updateMember(id, { first_name, last_name, position, sport }) {
  const db = await getDB();
  await db.runAsync(
    `UPDATE members
     SET first_name = ?, last_name = ?, position = ?, sport = ?, updated_at = ?
     WHERE id = ?`,
    [first_name, last_name, position || '', sport || '', nowISO(), id]
  );
}

/**
 * Adds delta to a member's balance (positive = add, negative = deduct).
 * Used for both session fee deductions and manual adjustments.
 * @param {number} id - Member ID
 * @param {number} delta - Amount to add (use negative to deduct)
 */
export async function adjustMemberBalance(id, delta) {
  const db = await getDB();
  await db.runAsync(
    'UPDATE members SET balance = balance + ?, updated_at = ? WHERE id = ?',
    [parseFloat(delta), nowISO(), id]
  );
}

/**
 * Deletes a member and all their session attendance records.
 * This is permanent — no soft delete.
 */
export async function deleteMember(id) {
  const db = await getDB();
  // Delete attendance records first to avoid orphaned rows
  await db.runAsync(
    'DELETE FROM session_attendance WHERE member_id = ?', [id]
  );
  await db.runAsync('DELETE FROM members WHERE id = ?', [id]);
}

/**
 * Inserts or updates a member matched by first_name + last_name.
 * Used during CSV import: if a member already exists, their balance is updated.
 * If they don't exist, a new member is created.
 *
 * Matching is case-insensitive.
 *
 * @returns {{ action: 'inserted'|'updated', id: number }}
 */
export async function upsertMemberByName({ first_name, last_name, balance }) {
  const db = await getDB();
  const existing = await db.getFirstAsync(
    `SELECT id FROM members
     WHERE LOWER(first_name) = LOWER(?) AND LOWER(last_name) = LOWER(?)`,
    [first_name, last_name]
  );
  if (existing) {
    await db.runAsync(
      'UPDATE members SET balance = ?, updated_at = ? WHERE id = ?',
      [parseFloat(balance) || 0, nowISO(), existing.id]
    );
    return { action: 'updated', id: existing.id };
  } else {
    const id = await insertMember({ first_name, last_name, balance });
    return { action: 'inserted', id };
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

/**
 * Returns all sessions sorted newest first.
 */
export async function getAllSessions() {
  const db = await getDB();
  return await db.getAllAsync(
    'SELECT * FROM sessions ORDER BY date DESC, id DESC'
  );
}

/**
 * Returns a single session by ID.
 */
export async function getSessionById(id) {
  const db = await getDB();
  return await db.getFirstAsync('SELECT * FROM sessions WHERE id = ?', [id]);
}

/**
 * Inserts a new session record.
 * @returns {number} The new session's ID
 */
export async function insertSession({ name, date, location, fee }) {
  const db = await getDB();
  const now = nowISO();
  const result = await db.runAsync(
    `INSERT INTO sessions (name, date, location, fee, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [name || '', date || '', location || '', parseFloat(fee) || 0, now]
  );
  return result.lastInsertRowId;
}

/**
 * Updates a session's display fields (name, date, location).
 * Fee is not updated — it was locked at session creation time.
 */
export async function updateSession(id, { name, date, location }) {
  const db = await getDB();
  await db.runAsync(
    'UPDATE sessions SET name = ?, date = ?, location = ? WHERE id = ?',
    [name || '', date || '', location || '', id]
  );
}

/**
 * Returns present/absent/deducted stats for a single session.
 * Used to display the stats row on each session card.
 */
export async function getSessionStats(sessionId) {
  const db = await getDB();
  const presentCount = await db.getFirstAsync(
    `SELECT COUNT(*) as cnt FROM session_attendance
     WHERE session_id = ? AND present = 1`,
    [sessionId]
  );
  const totalCount = await db.getFirstAsync(
    'SELECT COUNT(*) as cnt FROM session_attendance WHERE session_id = ?',
    [sessionId]
  );
  const session = await db.getFirstAsync(
    'SELECT fee FROM sessions WHERE id = ?', [sessionId]
  );
  const present = presentCount ? presentCount.cnt : 0;
  const total = totalCount ? totalCount.cnt : 0;
  const fee = session ? session.fee : 0;
  return { present, absent: total - present, total, deducted: present * fee };
}

/**
 * Calculates overall stats across all sessions for the Sessions tab header.
 * Returns total sessions, average attendance percentage, total euros collected.
 */
export async function getOverallSessionStats() {
  const db = await getDB();
  const sessions = await db.getAllAsync('SELECT id, fee FROM sessions');
  if (sessions.length === 0) {
    return { totalSessions: 0, avgAttendance: 0, totalCollected: 0 };
  }

  let totalPresent = 0;
  let totalPossible = 0;
  let totalCollected = 0;

  for (const s of sessions) {
    const presentRow = await db.getFirstAsync(
      `SELECT COUNT(*) as cnt FROM session_attendance
       WHERE session_id = ? AND present = 1`, [s.id]
    );
    const totalRow = await db.getFirstAsync(
      'SELECT COUNT(*) as cnt FROM session_attendance WHERE session_id = ?',
      [s.id]
    );
    const present = presentRow ? presentRow.cnt : 0;
    const total = totalRow ? totalRow.cnt : 0;
    totalPresent += present;
    totalPossible += total;
    totalCollected += present * (s.fee || 0);
  }

  const avgAttendance = totalPossible > 0
    ? Math.round((totalPresent / totalPossible) * 100)
    : 0;

  return { totalSessions: sessions.length, avgAttendance, totalCollected };
}

// ─── Session Attendance ───────────────────────────────────────────────────────

/**
 * Returns all attendance rows for a session.
 * Used by EditSession to pre-populate the member checklist.
 */
export async function getSessionAttendance(sessionId) {
  const db = await getDB();
  return await db.getAllAsync(
    'SELECT * FROM session_attendance WHERE session_id = ?', [sessionId]
  );
}

/**
 * Saves a new session with attendance records and deducts fees.
 *
 * For each member marked present:
 *   1. Inserts an attendance row with present = 1
 *   2. Deducts the session fee from their balance
 *
 * For absent members: inserts attendance row with present = 0, no balance change.
 *
 * @param {Object} params - Session details
 * @param {Array} params.attendance - [{memberId, present}]
 * @returns {number} New session ID
 */
export async function saveSessionWithAttendance({ name, date, location, fee, attendance }) {
  const sessionId = await insertSession({ name, date, location, fee });
  const db = await getDB();

  for (const row of attendance) {
    await db.runAsync(
      `INSERT INTO session_attendance (session_id, member_id, present)
       VALUES (?, ?, ?)`,
      [sessionId, row.memberId, row.present ? 1 : 0]
    );
    // Only deduct fee for present members
    if (row.present) {
      await adjustMemberBalance(row.memberId, -parseFloat(fee));
    }
  }
  return sessionId;
}

/**
 * Updates attendance for an existing session and adjusts balances accordingly.
 *
 * Diffs new attendance against existing records:
 *   - Was absent, now present → deduct fee
 *   - Was present, now absent → refund fee
 *   - New member (not in original session) → insert row, deduct if present
 *   - Unchanged → no action
 *
 * This ensures balances stay accurate when the coach edits a past session.
 *
 * @param {number} sessionId - Session to update
 * @param {Array} attendance - New attendance list [{memberId, present}]
 * @param {number} fee - Session fee (used for deduct/refund calculations)
 */
export async function updateSessionAttendance(sessionId, attendance, fee) {
  const db = await getDB();

  // Load existing attendance into a map for O(1) lookup
  const existing = await db.getAllAsync(
    'SELECT member_id, present FROM session_attendance WHERE session_id = ?',
    [sessionId]
  );
  const existingMap = {};
  existing.forEach(r => { existingMap[r.member_id] = r.present; });

  for (const row of attendance) {
    const wasPresent = existingMap[row.memberId];
    const isPresent = row.present ? 1 : 0;

    if (wasPresent === undefined) {
      // Member is new to this session — insert attendance row
      await db.runAsync(
        `INSERT INTO session_attendance (session_id, member_id, present)
         VALUES (?, ?, ?)`,
        [sessionId, row.memberId, isPresent]
      );
      if (isPresent) await adjustMemberBalance(row.memberId, -parseFloat(fee));

    } else if (wasPresent !== isPresent) {
      // Attendance status changed — update row and adjust balance
      await db.runAsync(
        `UPDATE session_attendance SET present = ?
         WHERE session_id = ? AND member_id = ?`,
        [isPresent, sessionId, row.memberId]
      );
      if (isPresent && !wasPresent) {
        // Absent → present: deduct fee
        await adjustMemberBalance(row.memberId, -parseFloat(fee));
      } else if (!isPresent && wasPresent) {
        // Present → absent: refund fee
        await adjustMemberBalance(row.memberId, parseFloat(fee));
      }
    }
    // If status unchanged: do nothing
  }
}

/**
 * Returns a member's full session history, newest first.
 * Joined with session details for display in the MemberDetail screen.
 */
export async function getMemberHistory(memberId) {
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT sa.present, sa.session_id, s.name, s.date, s.fee, s.location
     FROM session_attendance sa
     JOIN sessions s ON s.id = sa.session_id
     WHERE sa.member_id = ?
     ORDER BY s.date DESC, s.id DESC`,
    [memberId]
  );
}
