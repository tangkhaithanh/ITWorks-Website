/**
 * @typedef {'application' | 'interview' | 'job' | 'approval' | 'system' | 'reminder' | 'candidate' | 'recruiter' | 'company'} NotificationType
 */

/**
 * @typedef {Object} NotificationItem
 * @property {string} id
 * @property {string | null} account_id
 * @property {NotificationType | string} type
 * @property {string} message
 * @property {boolean} is_read
 * @property {string} created_at
 * @property {string} updated_at
 * @property {any=} payload
 */

/**
 * @typedef {Object} NotificationsPage
 * @property {NotificationItem[]} items
 * @property {string | null} nextCursor
 * @property {boolean} hasMore
 */

export const NOTIFICATION_TABS = {
  ALL: "all",
  UNREAD: "unread",
};

export const DEFAULT_NOTIFICATIONS_LIMIT = 10;