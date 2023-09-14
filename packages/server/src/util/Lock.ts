type Unlock = () => void;
export class Lock {
	private acquisitions = 0;
	private acqPrms: { promise: Promise<void>, resolve: () => void } | undefined

	lock(): Unlock {
		this.acquisitions++;
		this.acqPrms ??= Promise.withResolvers();
		return () => this.unlock()
	}

	async wait(): Promise<void> {
		await this.acqPrms?.promise;
	}

	private unlock(): void {
		this.acquisitions = Math.max(this.acquisitions - 1, 0);
		if (!this.acquisitions && this.acqPrms) {
			this.acqPrms.resolve();
			this.acqPrms = undefined;
		}
	}
}