/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   gameMeta.ts                                        :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/02/16 13:18:53 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/16 13:53:48 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import type { Game } from "$lib/types/types";

type PlayerMeta = {
  name: string;
  avatar_url: string;
};

type WsMetaSink = {
  setPlayerMeta: (playerId: string, meta: PlayerMeta) => void;
};

type LoadGameMetaOptions = {
  defaultAvatar: string;
  fetchImpl?: typeof fetch;
};

export function createGameMetaLoader(ws: WsMetaSink, opts: LoadGameMetaOptions) {
  const { defaultAvatar, fetchImpl = fetch } = opts;

  let loadedForRoom: string | null = null;

  async function loadGameRecord(roomId: string): Promise<Game | null> {
    try {
      const res = await fetchImpl(`/api/games/${roomId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const game = (await res.json()) as Game;

      for (const u of game.users ?? []) {
        ws.setPlayerMeta(String(u.id), {
          name: u.name,
          avatar_url: u.avatar_url ?? defaultAvatar,
        });
      }

      return (game);
    } catch (err) {
      console.error("loadGameRecord failed:", err);
      return (null);
    }
  }

  /**
   * Call this whenever your roomId changes
   * It ensures you only fetch once per room.
   */
  async function ensureLoaded(roomId: string | null | undefined) {
    if (!roomId) return (null);
    if (loadedForRoom === roomId) return null;

    loadedForRoom = roomId;
    return loadGameRecord(roomId);
  }

  /** If you want to refetch even for the same room, call this. */
  function reset(roomId: string | null = null) {
    loadedForRoom = roomId;
  }

  return { loadGameRecord, ensureLoaded, reset };
}
