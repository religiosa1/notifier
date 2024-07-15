import Database from 'better-sqlite3';
import { type SQLitePreparedQuery } from "drizzle-orm/sqlite-core";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { DatabaseNotReady } from "src/error/DatabaseNotReady";
import { di } from "src/injection";

import { Emitter } from "src/util/Emitter";
import * as schema from "./schema";
import { assert } from "src/util/assert";
import { getDatabase } from 'src/db/db';

export class DatabaseConnectionManager implements Disposable {
	private unsubscribeSettings: () => void;
	private emitter = new Emitter<{"change": (c: BetterSQLite3Database<typeof schema> | undefined) => void}>();

	#connection: BetterSQLite3Database<typeof schema> | undefined;
	#database: Database.Database | undefined;

 	get ready(): Promise<void> {
		if (this.#connection) {
			return Promise.resolve();
		}
		return new Promise<void>((res, rej) => {
			const to = setTimeout(() => {
				this.emitter.off("change", handleChange);
				rej(new Error("Timeout error while obtaining a db connection"));
			}, 15_000);
			this.emitter.on("change", handleChange);
			const self = this;
			function handleChange(c: BetterSQLite3Database<typeof schema> | undefined) {
				if (c == null) {
					return;
				}
				clearTimeout(to);
				self.emitter.off("change", handleChange);
				res();
			}
		});
	}

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

	constructor(
		private readonly settingsService = di.inject("SettingsService"),
		private readonly logger = di.inject("logger")
	) {
		this.unsubscribeSettings = this.settingsService.subscribe(async (config) => {
			if (this.#connection || this.#database) {
				this.#database?.close();
			}
			const {databaseFileName} = config ?? {};
			try {
				assert(databaseFileName);
				this.#database = getDatabase(databaseFileName);
				this.connection = databaseFileName ? drizzle(this.#database, { schema }) : undefined;
			} catch(e) {
				this.logger.error("Unable to connect to DB", e);
				this.connection = undefined;
				this.#database = undefined;
			}
		}, ["databaseFileName"]);
	}

	async [Symbol.dispose]() {
		this.dispose();
	}
	dispose() {
		this.unsubscribeSettings?.();
		this.close();
		this.emitter.clear();
	}

	close() {
		this.#database?.close();
		this.#database = undefined;
		this.connection = undefined;
	}

	prepare<T extends SQLitePreparedQuery<any>>(
		cb: (db: BetterSQLite3Database<typeof schema>) => T
	): LazyQueryRef<T, [BetterSQLite3Database<typeof schema> | undefined]> {
		const ref = new LazyQueryRef<T, [BetterSQLite3Database<typeof schema> | undefined]>(
			(db) => {
				if (db == null) {
					return undefined;
				}
				return cb(db);
			},
			[this.#connection]
		);
		this.emitter.on("change", (db) => ref.push(db));
		return ref;
	}
}

export class LazyQueryRef<T extends {}, TDeps extends ReadonlyArray<unknown>> {
	#value: T | undefined;

	get value(): T {
		this.#value ??= this.init(...this.deps);
		if (this.#value === undefined) {
			throw new DatabaseNotReady();
		}
		return this.#value;
	}

	constructor (
		private readonly init: (...deps: TDeps) => T | undefined,
		private deps: TDeps,
	) {}

	push(...deps: TDeps) {
		this.deps = deps;
		this.#value = this.init(...this.deps);
	}
}
