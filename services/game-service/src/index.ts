/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   index.ts                                           :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 16:22:50 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/01/06 16:22:52 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { RoomManager } from "./app/room_manager";
import { startInternalWsServer } from "./transport/internal_ws";

const port = Number(process.env.INTERNAL_WS_PORT ?? 3002);

const rooms = new RoomManager();
startInternalWsServer({ port, path: "/internal" }, rooms);
