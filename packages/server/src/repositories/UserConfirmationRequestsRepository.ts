import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { UserWithGroups } from "@shared/models/User";
import { eq, inArray, sql } from "drizzle-orm";
import { schema } from "src/db";
import { inject } from "src/injection";

export class UserConfirmationRequestsRepository {
	private readonly dbm = inject("db");

	//============================================================================
	// LIST

	private readonly queryCountConfirmationRequests = this.dbm.prepare(
		(db) => db.select({ count: sql<number>`count(*)::int` }).from(schema.users)
			.where(eq(schema.users.authorizationStatus, AuthorizationEnum.pending))
			.prepare("count_confirmation_requests")
	);
	private readonly queryListConfirmationRequests = this.dbm.prepare(
		(db) => db.query.users.findMany({
			offset: sql.placeholder("skip"),
			limit: sql.placeholder("take"),
			where: (user, {eq}) => eq(user.authorizationStatus, AuthorizationEnum.pending),
			with: {
				groups: { with: { group: {
					columns: {
						id: true,
						name: true,
					}
				}}},
			}
		})
		.prepare("list_confirmation_requests")
	);

	async listConfirmationRequests({ skip = 0, take = 20 } = {}): Promise<{
		count: number;
		users: UserWithGroups[];
	}> {
		const [
			[{count = -1} = {}],
			users
		] = await Promise.all([
			this.queryCountConfirmationRequests.value.execute(),
			this.queryListConfirmationRequests.value.execute({ skip, take }),
		]);
		return {
			count,
			users: users.map(user => ({
				...user,
				groups: user.groups.map(g => g.group)
			})),
		}
	}

	//============================================================================
	// ACCEPT

	private readonly queryAcceptConfirmationRequest = this.dbm.prepare(
		(db) => db.update(schema.users)
				.set({ authorizationStatus: AuthorizationEnum.accepted, updatedAt: sql`CURRENT_TIMESTAMP` })
				.where(inArray(schema.users.id, sql.placeholder("userIds")))
				.returning({ count: sql<number>`count(*)::int` })
				.prepare("accept_confimation_requests")
	);
	async acceptConfirmationRequests(userIds: number[]): Promise<number> {
		if (!userIds.length) {
			return 0;
		}
		const [{count = -1} = {}] = await this.queryAcceptConfirmationRequest.value.execute({ userIds });
		return count;
	}

	//============================================================================
	// DECLINE

	private readonly queryDeclineConfirmationRequests = this.dbm.prepare(
		(db) => db.update(schema.users)
			.set({ authorizationStatus: AuthorizationEnum.declined, updatedAt: sql`CURRENT_TIMESTAMP` })
			.where(inArray(schema.users.id, sql.placeholder("userIds")))
			.returning({ count: sql<number>`count(*)::int` })
			.prepare("decline_confirmation_requests")
	);
	async declineConfirmationRequests(userIds: number[]): Promise<number> {
		if (!userIds.length) {
			return 0;
		}
		const [{count = -1} = {}] = await this.queryDeclineConfirmationRequests.value.execute({ userIds });
		return count;
	}
}