import Database from 'better-sqlite3';
import { type SQLitePreparedQuery } from "drizzle-orm/sqlite-core";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { DatabaseNotReady } from "src/error/DatabaseNotReady";
import { di } from "src/injection";

import { Emitter } from "src/util/Emitter";
import * as schema from "./schema";
import { assert } from "src/util/assert";
import { getDatabase } from 'src/db/db';

export class DatabaseConnectionManager {
	private dispose: () => void;
	private emitter = new Emitter<{"change": (c: BetterSQLite3Database<typeof schema> | undefined) => void}>();

	#connection: BetterSQLite3Database<typeof schema> | undefined;
	#database: Database.Database | undefined;

	get connection(): BetterSQLite3Database<typeof schema> {
		const conn = this.#connection
		if (!conn) {
			throw new DatabaseNotReady();
		}
		return conn;
	}
	private set connection(c: BetterSQLite3Database<typeof schema> | undefined) {
		this.#connection = c;
		this.emitter.emit("change", c);
	}

	constructor() {
		const settingsService = di.inject("SettingsService")
		this.dispose = settingsService.subscribe(async (config) => {
			if (this.#connection || this.#database) {
				this.#database?.close();
			}
			const {databaseFileName} = config ?? {};
			try {
				assert(databaseFileName);
				this.#database = getDatabase(databaseFileName);
				this.connection = databaseFileName ? drizzle(this.#database, { schema }) : undefined;
			} catch(e) {
				const logger = di.inject("logger");
				logger.error("Unable to connect to DB", e);
				this.connection = undefined;
				this.#database = undefined;
			}
		}, ["databaseFileName"]);
	}

	async [Symbol.asyncDispose]() {
		this.dispose?.();
		this.#database?.close();
		this.#database = undefined;
		this.#connection = undefined;
		this.emitter.clear();
	}

	prepare<T extends SQLitePreparedQuery<any>>(cb: (db: BetterSQLite3Database<typeof schema>) => T): RefObject<T> {
		const ref = new RefObject<T>(
			this.#connection ? cb(this.#connection) : undefined
		);
		this.emitter.on("change", (db) => {
			ref.value = db ? cb(db) : undefined;
		})
		return ref;
	}
}

export class RefObject<T extends {}> {
	#value: T | undefined;
	set value(value: T | undefined) {
		this.#value = value;
	}
	get value(): T {
		const value = this.#value;
		if (value === undefined) {
			throw new DatabaseNotReady();
		}
		return value;
	}

	constructor (value: T | undefined = undefined) {
		this.#value = value;
	}
}
