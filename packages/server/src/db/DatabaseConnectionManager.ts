import { PreparedQuery } from 'drizzle-orm/pg-core';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DatabaseNotReady } from 'src/error/DatabaseNotReady';
import { inject } from 'src/injection';
import { Emitter } from 'src/util/Emitter';
import * as schema from "./schema";

export class DatabaseConnectionManager {
	private dispose: () => void;
	private emitter = new Emitter<{"change": (c: PostgresJsDatabase<typeof schema> | undefined) => void}>();

	#connection: PostgresJsDatabase<typeof schema> | undefined;
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
		this.dispose = settingsService.subscribe((config) => {
			const {databaseUrl} = config ?? {};
			try {
				this.connection = databaseUrl ? drizzle(postgres(databaseUrl), { schema }) : undefined;
			} catch(e) {
				const logger = inject("logger");
				logger.error("Unable to connect to DB", e);
				this.connection = undefined;
			}
		}, ["databaseUrl"]);
	}

	[Symbol.dispose]() {
		this.dispose?.();
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

// for query purposes
// for migrations
// import { migrate } from 'drizzle-orm/postgres-js/migrator';
// const migrationClient = postgres("postgres://postgres:adminadmin@0.0.0.0:5432/db", { max: 1 });
// migrate(drizzle(migrationClient), ...)


// export type DbTransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">