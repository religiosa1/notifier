type UnsubscribeCb = () => void;
type DefaultEventMap = Record<string, (...args: any[]) => unknown>
export class Emitter<TEventMap extends DefaultEventMap = DefaultEventMap> {
	events = new Map<keyof TEventMap, Set<TEventMap[keyof TEventMap]>>();

	emit<TEvent extends keyof TEventMap>(event: TEvent, ...args: Parameters<TEventMap[TEvent]>) {
		const callbacks = this.events.get(event);
		if (!callbacks) { return }
		for (const cb of callbacks) {
			cb.apply(undefined, args);
		}
	}

	on<TEvent extends keyof TEventMap>(event: TEvent, cb: TEventMap[TEvent]): UnsubscribeCb {
		if (!this.events.has(event)) {
			this.events.set(event, new Set());
		}
		const events = this.events.get(event)!;
		events.add(cb);
		return () => events.delete(cb);
	}

	once<TEvent extends keyof TEventMap>(event: TEvent, cb: TEventMap[TEvent]): UnsubscribeCb {
		const unsub = this.on(event, ((...args) => {
			unsub();
			return cb.apply(undefined, args);
		}) as TEventMap[TEvent]);
		return unsub;
	}

	off<TEvent extends keyof TEventMap>(event: TEvent, cb: TEventMap[TEvent]): void {
		const events = this.events.get(event);
		if (!events) {
			return;
		}
		events.delete(cb);
	}

	clear() {
		this.events.clear();
	}
}