/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   send_ws.ts                                         :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/03/06 09:17:52 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/03/06 09:18:07 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import type WebSocket from "ws";

import {
	ServerMsgSchema,
	type ServerMsg,
} from "@ft/game-ws-protocol";

export function safeSend(ws: WebSocket, obj: unknown) {
	if (ws.readyState === ws.OPEN)
		ws.send(JSON.stringify(obj));
}

export function safeSendServer(ws: WebSocket, msg: ServerMsg) {
	if (ws.readyState !== ws.OPEN)
		return;

	const parsed = ServerMsgSchema.safeParse(msg);
	if (!parsed.success) {
		console.error("BUG: invalid ServerMsg being sent", parsed.error.format(), msg);
		return;
	}

	ws.send(JSON.stringify(parsed.data));
}
