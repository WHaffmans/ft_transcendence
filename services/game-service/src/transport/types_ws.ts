/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   types_ws.ts                                        :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/03/06 09:40:27 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/03/06 09:42:14 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import type WebSocket from "ws";
import { RoomManager } from "../app/room_manager.js";
import type { IncomingMessage } from "http";

/**
 * Define context for handles
 */
export type WsContext = {
	ws: WebSocket;
	req: IncomingMessage;
	rooms: RoomManager;
	authenticatedUserId: string | null;
	getBound: () => { roomId: string | null; playerId: string | null };
	setBound: (roomId: string | null, playerId: string | null) => void;
};
