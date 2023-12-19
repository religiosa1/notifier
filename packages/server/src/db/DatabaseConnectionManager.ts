import { PreparedQuery } from 'drizzle-orm/pg-core';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DatabaseNotReady } from 'src/error/DatabaseNotReady';
import { inject } from 'src/injection';
import { Emitter } from 'src/util/Emitter';
import * as schema from "./schema";
import { assert } from 'src/util/assert';

export class DatabaseConnectionManager {
	private dispose: () => void;
	private emitter = new Emitter<{"change": (c: PostgresJsDatabase<typeof schema> | undefined) => void}>();

	#connection: PostgresJsDatabase<typeof schema> | undefined;
	#postgresConnection: postgres.Sql | undefined;
	get connection(): PostgresJsDatabase<typeof schema> {
		const conn = this.#connection
		if (!conn) {
			throw new DatabaseNotReady();
		}
		return conn;
	}
	private set connection(c: PostgresJsDatabase<typeof schema> | undefined) {
		this.#connection  = c;
		this.emitter.emit("change", c);
	}

	constructor() {
		const settingsService = inject("SettingsService")
		this.dispose = settingsService.subscribe(async (config) => {
			if (this.#connection || this.#postgresConnection) {
				await this.#postgresConnection?.end({ timeout: 20 });
			}
			const {databaseUrl} = config ?? {};
			try {
				assert(databaseUrl);
				this.#postgresConnection = postgres(databaseUrl);
				this.connection = databaseUrl ? drizzle(this.#postgresConnection, { schema }) : undefined;
			} catch(e) {
				const logger = inject("logger");
				logger.error("Unable to connect to DB", e);
				this.connection = undefined;
				this.#postgresConnection = undefined;
			}
		}, ["databaseUrl"]);
	}

	async [Symbol.asyncDispose]() {
		this.dispose?.();
		await this.#postgresConnection?.end({ timeout: 5 });
		this.#postgresConnection = undefined;
		this.#connection = undefined;
		this.emitter.clear();
	}

	prepare<T extends PreparedQuery<any>>(cb: (db: PostgresJsDatabase<typeof schema>) => T): RefObject<T> {
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
