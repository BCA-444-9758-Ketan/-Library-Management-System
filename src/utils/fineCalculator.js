/**
 * Fine calculation utility.
 *
 * Centralized business logic for overdue fine calculation.
 * Rate is configurable via FINE_PER_DAY env variable.
 */

const FINE_PER_DAY = parseInt(process.env.FINE_PER_DAY, 10) || 5;

/**
 * Calculate fine amount based on due date and return date.
 * @param {Date} dueDate - When the book was due
 * @param {Date} [returnDate=now] - When the book was actually returned
 * @returns {{ isOverdue: boolean, daysOverdue: number, fineAmount: number }}
 */
const calculateFine = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  // Zero out time components for clean day-based diff
  due.setHours(0, 0, 0, 0);
  returned.setHours(0, 0, 0, 0);

  const diffMs = returned.getTime() - due.getTime();
  const daysOverdue = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    isOverdue: daysOverdue > 0,
    daysOverdue,
    fineAmount: daysOverdue * FINE_PER_DAY,
  };
};

module.exports = { calculateFine, FINE_PER_DAY };
