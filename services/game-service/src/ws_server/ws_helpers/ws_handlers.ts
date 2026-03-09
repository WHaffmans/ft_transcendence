/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   ws_handlers.ts                                     :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/03/06 09:23:21 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/03/09 14:03:54 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import type { GameConfig } from "../../engine/config.js";
import { DEFAULT_CONFIG } from "../../engine/config.js";
import { safeSendServer } from "./ws_send.js";
import { WsContext } from "./ws_types.js";

import {
	type ClientMsg,
	type ServerMsg,
	WS_CLOSE_AUTH_FAILURE,
} from "@ft/game-ws-protocol";


/* ====================================================================== */
/*                              HELPERS                                   */
/* ====================================================================== */

function normalizeConfig(partial: unknown): GameConfig {
    const p =
        partial && typeof partial === "object" && partial !== null
            ? (partial as Partial<GameConfig>)
            : undefined;

    const config: GameConfig = {
        ...DEFAULT_CONFIG,
        ...(p ?? {}),
    };

    for (const [k, v] of Object.entries(config)) {
        if (typeof v === "number" && !Number.isFinite(v)) {
            throw new Error(`Invalid config: ${k} is ${v}`);
        }
    }

    return (config);
}


/* ====================================================================== */
/*                              CREATE / JOIN                             */
/* ====================================================================== */

export function handleCreateOrJoinRoom(
    ctx: WsContext,
    msg: Extract<ClientMsg, { type: "create_or_join_room" }>
) {
	const { ws, rooms, authenticatedUserId } = ctx;
	const { roomId: boundRoomId } = ctx.getBound();

	if (boundRoomId && boundRoomId !== msg.roomId) {
		try { rooms.unsubscribe(boundRoomId, ws); } catch {}
		ctx.setBound(null, null);
	}

	const config = normalizeConfig(msg.config);
	const seed = msg.seed;

	ctx.setBound(msg.roomId, msg.player.playerId);

	const joinArgs = {
		roomId: msg.roomId,
		player: msg.player,
		seed,
		config,
		...(msg.resumeToken !== undefined ? { resumeToken: msg.resumeToken } : {}),
	};

	const { room, playerId: effectivePlayerId, resumeToken } = rooms.createOrJoinRoom(joinArgs, ws);

    // Check auth
	if (authenticatedUserId && effectivePlayerId !== authenticatedUserId) {
		try { rooms.unsubscribe(room.roomId, ws); } catch {}
		try { rooms.onPlayerSocketLost(room.roomId, effectivePlayerId, ws, { code: WS_CLOSE_AUTH_FAILURE, reason: "effective playerId mismatch", }); } catch {}

		ws.close(WS_CLOSE_AUTH_FAILURE, "Effective playerId mismatch");
		ctx.setBound(null, null);
		return;
	}

	ctx.setBound(room.roomId, effectivePlayerId);

	safeSendServer(ws, {
		type: "joined",
		roomId: room.roomId,
		playerId: effectivePlayerId,
		resumeToken,
	} satisfies ServerMsg);
}


/* ====================================================================== */
/*                              UPDATE SCENE                              */
/* ====================================================================== */

export function handleUpdateScene(
	ctx: WsContext,
	msg: Extract<ClientMsg, { type: "update_scene" }>
) {
	const { rooms } = ctx;
	const { roomId: boundRoomId, playerId: boundPlayerId } = ctx.getBound();

	if (!boundRoomId || !boundPlayerId) {
		throw new Error("Must join_room first");
	}

	if (msg.roomId !== boundRoomId || msg.playerId !== boundPlayerId) {
		throw new Error("update_scene: room/player mismatch");
	}

	ctx.setBound(msg.roomId, msg.playerId);

	rooms.broadcastState(boundRoomId);
	rooms.updatePlayerScene(boundRoomId, boundPlayerId, msg.scene);
	rooms.broadcastState(boundRoomId);
	rooms.willUpdateRoomPhase(boundRoomId);
}


/* ====================================================================== */
/*                              START GAME                                */
/* ====================================================================== */

export function handleStartGame(
	ctx: WsContext,
	msg: Extract<ClientMsg, { type: "start_game" }>
) {
	const { rooms } = ctx;
	const { roomId: boundRoomId, playerId: boundPlayerId } = ctx.getBound();

	if (!boundRoomId || !boundPlayerId) {
		throw new Error("Must `create_or_join_room` first");
	}

	if (msg.roomId !== boundRoomId) {
		throw new Error("start_game: room mismatch");
	}

	const room = rooms.get(boundRoomId);
	if (!room) {
		throw new Error(`Unknown roomId: ${boundRoomId}`);
	}

	if (room.phase !== "ready") {
		throw new Error(`Room is not ready (phase=${room.phase})`);
	}

	rooms.setRoomToRunning(boundRoomId);
	rooms.broadcast(boundRoomId, {
		type: "game_started",
		roomId: boundRoomId,
	} satisfies ServerMsg);
	rooms.startRoom(boundRoomId);
}


/* ====================================================================== */
/*                              LEAVE ROOM                                */
/* ====================================================================== */

export function handleLeaveRoom(
	ctx: WsContext,
	msg: Extract<ClientMsg, { type: "leave_room" }>
) {
	const { ws, rooms } = ctx;
	const { roomId: boundRoomId, playerId: boundPlayerId } = ctx.getBound();

	if (!boundRoomId || !boundPlayerId) {
		throw new Error("Must join_room first");
	}

	if (msg.roomId !== boundRoomId || msg.playerId !== boundPlayerId) {
		throw new Error("leave_room: room/player mismatch");
	}

	rooms.onPlayerDisconnected(boundRoomId, boundPlayerId, ws, "Player exit");
	rooms.broadcast(boundRoomId, {
		type: "left",
		roomId: boundRoomId,
		playerId: boundPlayerId,
	} satisfies ServerMsg);
	rooms.unsubscribe(boundRoomId, ws);

	ctx.setBound(null, null);
}


/* ====================================================================== */
/*                              INPUT                                     */
/* ====================================================================== */

export function handleInput(
	ctx: WsContext,
	msg: Extract<ClientMsg, { type: "input" }>
) {
	const { ws, rooms } = ctx;
	const { roomId: boundRoomId, playerId: boundPlayerId } = ctx.getBound();

	if (!boundRoomId || !boundPlayerId) {
		throw new Error("Must join_room first");
	}

	const room = rooms.get(boundRoomId);
	if (!room) {
		return;
	}

	// Reject input if not bound
	if (!rooms.isBoundSocket(boundRoomId, boundPlayerId, ws)) {
		return;
	}

	rooms.pushInput({
		roomId: boundRoomId,
		playerId: boundPlayerId,
		turn: msg.turn,
	});
}
