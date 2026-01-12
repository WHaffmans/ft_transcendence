/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   index.ts                                           :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 16:22:50 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/01/07 11:15:42 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { RoomManager } from "./app/room_manager";
import { startInternalWsServer } from "./transport/internal_ws";
import { startPublicWsServer } from "./transport/external_ws";

const rooms = new RoomManager();

startInternalWsServer({ port: 3002, path: "/internal" }, rooms);
startPublicWsServer({ port: 3003, path: "/ws" }, rooms);
