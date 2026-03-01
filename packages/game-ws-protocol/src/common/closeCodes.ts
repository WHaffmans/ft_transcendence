
/**
 * WebSocket Close Codes
 *
 * Standard codes (RFC 6455):
 *   1000 – Normal closure
 *   1001 – Going away (server shutdown / page navigation)
 *
 * Application codes (4000–4999, reserved for application use):
 *   4000 – Room closed normally
 *   4001 – Kicked for AFK / inactivity
 *   4002 – Authentication failure (playerId mismatch)
 *   4003 – Room is full
 *   4004 – Repeated invalid messages
 */

// ── Standard ──────────────────────────────────────────────────────────────────
export const WS_CLOSE_NORMAL     = 1000;
export const WS_CLOSE_GOING_AWAY = 1001;

// ── Application ───────────────────────────────────────────────────────────────
export const WS_CLOSE_ROOM_CLOSED  = 4000;
export const WS_CLOSE_AFK_KICK     = 4001;
export const WS_CLOSE_AUTH_FAILURE  = 4002;
export const WS_CLOSE_ROOM_FULL    = 4003;
export const WS_CLOSE_INVALID_MSG  = 4004;

/** Human-readable label for each close code (useful for logging). */
export const WS_CLOSE_LABELS: Record<number, string> = {
	[WS_CLOSE_NORMAL]:      "normal",
	[WS_CLOSE_GOING_AWAY]:  "going_away",
	[WS_CLOSE_ROOM_CLOSED]: "room_closed",
	[WS_CLOSE_AFK_KICK]:    "afk_kick",
	[WS_CLOSE_AUTH_FAILURE]: "auth_failure",
	[WS_CLOSE_ROOM_FULL]:   "room_full",
	[WS_CLOSE_INVALID_MSG]: "invalid_msg",
};
