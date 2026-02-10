/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   index.ts                                           :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 16:22:50 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/10 10:24:04 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { RoomManager } from "./app/room_manager.js";
import { startPublicWsServer } from "./transport/external_ws.js";
import "dotenv/config";

const rooms = new RoomManager();

const publicPort = Number(3003);
console.log("Starting PUBLIC WS on", { host: "0.0.0.0", port: publicPort, path: "/ws" });
startPublicWsServer({ port: publicPort, path: "/ws" }, rooms);
