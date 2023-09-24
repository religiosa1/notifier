import postgres from 'postgres';

export class DatabaseConfigurator {
	async checkConnectionString(connectionString: string): Promise<boolean> {
		try {
			const sql = postgres(connectionString, { max: 1 });
			const data = sql`SELECT version();`
			console.log("DATA", data);
			return true;
		} catch {
			return false;
		}
	}
}