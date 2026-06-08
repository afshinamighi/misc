/**
 * format.js — Utility functions for formatting values throughout Squadify
 *
 * Centralising formatting here means all screens display dates, currencies,
 * and file sizes consistently. To change how something is displayed globally,
 * just update it here.
 */

/**
 * Formats a number as a Euro currency string with sign.
 * Negative values get a minus prefix: "-€3.00"
 * Zero and positive: "€5.00"
 *
 * @param {number|string} amount - The balance or fee amount
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  const value = parseFloat(amount) || 0;
  const abs = Math.abs(value).toFixed(2);
  return value < 0 ? `-€${abs}` : `€${abs}`;
}

/**
 * Returns the raw numeric balance as a plain string with 2 decimal places.
 * Used for CSV export where the Euro sign would break parsing.
 *
 * @param {number|string} amount
 * @returns {string} e.g. "15.00" or "-3.50"
 */
export function formatCurrencyPlain(amount) {
  return (parseFloat(amount) || 0).toFixed(2);
}

/**
 * Formats an ISO date string into a human-readable display format.
 * e.g. "2025-04-15T18:30:00.000Z" → "15 Apr 2025"
 *
 * Returns the original string unchanged if it can't be parsed.
 *
 * @param {string} dateString - ISO date string or display date string
 * @returns {string} Formatted date e.g. "15 Apr 2025"
 */
export function formatDateDisplay(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString; // return as-is if not a valid date
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns today's date formatted for display in session date fields.
 * Pre-fills the date input when creating a new session.
 *
 * @returns {string} e.g. "10 Apr 2026"
 */
export function todayDisplay() {
  return formatDateDisplay(new Date().toISOString());
}

/**
 * Returns the current date and time as an ISO 8601 string.
 * Used for created_at and updated_at timestamps in the database.
 *
 * @returns {string} e.g. "2026-04-10T14:30:00.000Z"
 */
export function nowISO() {
  return new Date().toISOString();
}

/**
 * Returns a filesystem-safe timestamp string for use in export filenames.
 * Colons in time are replaced with hyphens to avoid file system issues.
 *
 * @returns {string} e.g. "2026-04-10_14-30"
 */
export function fileTimestamp() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);          // "2026-04-10"
  const time = d.toTimeString().slice(0, 5).replace(':', '-'); // "14-30"
  return `${date}_${time}`;
}

/**
 * Formats a file size in bytes into a human-readable string.
 * Shows MB if >= 1 MB, otherwise KB.
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} e.g. "2.1 MB" or "340 KB"
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}
