import postgres from 'postgres';

export class DatabaseConfigurator {
	async checkConnectionString(connectionString: string): Promise<boolean> {
		try {
			const sql = postgres(connectionString, { max: 1 });
			await sql`SELECT version();`
			return true;
		} catch {
			return false;
		}
	}
}