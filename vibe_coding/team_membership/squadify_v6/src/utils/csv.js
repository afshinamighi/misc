/**
 * csv.js — CSV parsing, generation, and file export utilities for Squadify
 *
 * SDK 54 file system strategy:
 *   - expo-file-system/next  → writing files (File, Directory, Paths)
 *   - expo-file-system/legacy → reading files and DB size checks
 *   - Never use plain 'expo-file-system' — all its methods are deprecated in SDK 54
 */

import { File, Directory, Paths } from 'expo-file-system/next';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { fileTimestamp, nowISO } from './format';

// ─── CSV Parse ────────────────────────────────────────────────────────────────
/**
 * Parses raw CSV text into an array of member objects.
 *
 * Handles:
 * - BOM character (\uFEFF) added by Excel — stripped automatically
 * - Windows line endings (\r\n) and Unix (\n)
 * - Empty last name column — treated as empty string, not an error
 * - Optional header row — skipped if first column equals "first_name"
 * - Members with only a first name (no last name column at all)
 *
 * Expected column order (positional, header optional):
 *   col 0 = first_name, col 1 = last_name, col 2 = balance
 *
 * @param {string} text - Raw CSV file content
 * @returns {Array<{first_name, last_name, balance}>}
 */
export function parseCSV(text) {
  // Strip UTF-8 BOM that Excel automatically adds to CSV exports
  const cleaned = text.replace(/^\uFEFF/, '');

  const lines = cleaned
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return [];

  // Skip header row if detected
  let startIndex = 0;
  const firstCols = lines[0].split(',').map(c => c.trim().toLowerCase());
  if (firstCols[0] === 'first_name' || firstCols[0] === 'firstname') {
    startIndex = 1;
  }

  const rows = [];
  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 1) continue;
    const first_name = cols[0] || '';
    const last_name  = cols.length > 1 ? (cols[1] || '') : '';
    const balance    = cols.length > 2 ? (parseFloat(cols[2]) || 0) : 0;
    if (!first_name && !last_name) continue;
    rows.push({ first_name, last_name, balance });
  }

  return rows;
}

// ─── CSV Generate ─────────────────────────────────────────────────────────────
/**
 * Generates a CSV string from an array of member objects.
 * Includes header row. Output columns:
 *   first_name, last_name, sport, balance, exported_at
 *
 * @param {Array} members - Member objects from the database
 * @returns {string} Complete CSV content
 */
export function generateCSV(members) {
  const exportedAt = nowISO();
  const header = 'first_name,last_name,sport,balance,exported_at';
  const rows = members.map(m => {
    const bal = (parseFloat(m.balance) || 0).toFixed(2);
    const sport = (m.sport || '').replace(/,/g, ' ');
    return `${m.first_name},${m.last_name},${sport},${bal},${exportedAt}`;
  });
  return [header, ...rows].join('\n');
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
/**
 * Exports member balances to a CSV file and opens the native share sheet.
 *
 * Uses expo-file-system/next for writing (File, Directory, Paths) — the correct
 * SDK 54 API for writing to the app's own document directory.
 *
 * File is saved to: <documents>/Squadify/squadify_balances_YYYY-MM-DD_HH-MM.csv
 *
 * @param {Array} members - Member objects to export
 * @returns {string} URI of the written file
 */
export async function exportCSV(members) {
  const csv = generateCSV(members);
  const filename = `squadify_balances_${fileTimestamp()}.csv`;

  // Create /Documents/Squadify/ directory if it doesn't exist
  const dir = new Directory(Paths.document, 'Squadify');
  if (!dir.exists) {
    dir.create();
  }

  // Write CSV content using the new File API
  const file = new File(dir, filename);
  file.write(csv);

  // Share via native share sheet (email, WhatsApp, Files, etc.)
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export member balances',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return file.uri;
}

// ─── DB Size ──────────────────────────────────────────────────────────────────
/**
 * Returns the SQLite database file size in bytes.
 * Uses expo-file-system/next File API.
 *
 * @returns {number} Size in bytes, or 0 if not found
 */
export async function getDBSize() {
  try {
    const dbFile = new File(Paths.document, 'SQLite/squadify.db');
    if (dbFile.exists) {
      return dbFile.size ?? 0;
    }
    return 0;
  } catch {
    return 0;
  }
}
