export async function asyncPool<T>(
	promises: Iterable<Promise<T>>,
	backlog = 10
): Promise<PromiseSettledResult<T>[]> {
	const retval: PromiseSettledResult<T>[] = [];
	const pool = new Set<Promise<any>>();
	let i = 0;
	for (const prms of promises) {
		if (pool.size >= backlog) {
			await Promise.race(pool);
		}
		const j = i;
		pool.add(prms);
		prms
			.then(value => retval[j] = { status: "fulfilled", value })
			.catch(reason => retval[j] = { status: "rejected", reason })
			.finally(() => pool.delete(prms));
		++i;
	}
	return retval;
}