import Dexie, { type Table } from "dexie"
import type { Song, Album, Playlist } from "@/lib/types"

export class DJStudioDB extends Dexie {
  songs!: Table<Song, string>
  albums!: Table<Album, string>
  playlists!: Table<Playlist, string>

  constructor() {
    super("DJStudioDB")
    this.version(1).stores({
      songs: "&id, title, artist, duration",
      albums: "&id, title",
      playlists: "&id, title",
    })
  }
}

export const db = new DJStudioDB()
