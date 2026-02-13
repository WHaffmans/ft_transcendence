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
import https from "https";
import fs from "fs";
import "dotenv/config";

const rooms = new RoomManager();

const isProduction = process.env.NODE_ENV === "production";
const publicPort = isProduction ? 3443 : 3003;

// Create HTTPS server for production
let httpsServer = undefined;
if (isProduction) {
	const options = {
		key: fs.readFileSync("/certs/prod/game-key.pem"),
		cert: fs.readFileSync("/certs/prod/game-cert.pem")
	};
	httpsServer = https.createServer(options);
	httpsServer.listen(publicPort, "0.0.0.0", () => {
		console.log(`HTTPS server listening on port ${publicPort}`);
	});
}

console.log("Starting PUBLIC WS on", { 
	host: "0.0.0.0", 
	port: publicPort, 
	path: "/ws", 
	secure: isProduction 
});
startPublicWsServer({ port: publicPort, path: "/ws", server: httpsServer }, rooms);
