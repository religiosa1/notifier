import { describe, it, expect, vi } from "vitest";
import { Emitter } from "../Emitter";

describe("Emitter", () => {
	it("subscribes to an event", () => {
		const fn = vi.fn();
		const emitter = new Emitter();
		emitter.on("test", fn);
		emitter.emit("test");
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("triggers only the correct subscriptions for the event name", () => {
		const fn1 = vi.fn();
		const fn2 = vi.fn();
		const emitter = new Emitter();
		emitter.on("test1", fn1);
		emitter.on("test2", fn2);
		emitter.emit("test1");
		expect(fn1).toHaveBeenCalledOnce();
		expect(fn2).not.toHaveBeenCalled();
	});

	it("incorrect event names do nothing", () => {
		const fn = vi.fn();
		const emitter = new Emitter();
		emitter.on("test", fn);
		emitter.emit("test2");
		expect(fn).not.toHaveBeenCalled();
	});

	it("allows to have multiple subscriptions", () => {
		const fn1 = vi.fn();
		const fn2 = vi.fn();
		const emitter = new Emitter();
		emitter.on("test", fn1);
		emitter.on("test", fn2);
		emitter.emit("test");
		expect(fn1).toHaveBeenCalledOnce();
		expect(fn2).toHaveBeenCalledOnce();
	});

	it("returns an unsubscribe function", () => {
		const fn1 = vi.fn();
		const fn2 = vi.fn();
		const emitter = new Emitter();
		const unsub = emitter.on("test", fn1);
		emitter.on("test", fn2);
		unsub();
		emitter.emit("test");
		expect(fn1).not.toHaveBeenCalled();
		expect(fn2).toHaveBeenCalledOnce();
	});

	it("passes args to subscribers", () => {
		const fn = vi.fn();
		const emitter = new Emitter();
		emitter.on("test", fn);
		emitter.emit("test", 321, 67);
		expect(fn).toHaveBeenCalledOnce();
		expect(fn).toHaveBeenLastCalledWith(321, 67);
	});

	it("calls subscribes multiple times on multiple emits", () => {
		const fn = vi.fn();
		const emitter = new Emitter();
		emitter.on("test", fn);
		emitter.emit("test");
		emitter.emit("test");
		emitter.emit("test");
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it("calls subscriber once if it was added multiple times", () => {
		const fn = vi.fn();
		const emitter = new Emitter();
		emitter.on("test", fn);
		emitter.on("test", fn);
		emitter.emit("test");
		expect(fn).toHaveBeenCalledOnce();
	});

	describe("off", () => {
		it("cancels subscription with off()", () => {
			const fn1 = vi.fn();
			const fn2 = vi.fn();
			const emitter = new Emitter();
			emitter.on("test", fn1);
			emitter.on("test", fn2);
			emitter.off("test", fn1);
			emitter.emit("test");
			expect(fn1).not.toHaveBeenCalled();
			expect(fn2).toHaveBeenCalledOnce();
		});

		it("creates a singleshot subscription with once()", () => {
			const fn1 = vi.fn();
			const fn2 = vi.fn();
			const emitter = new Emitter();
			emitter.on("test", fn1);
			emitter.once("test", fn2);
			emitter.emit("test");
			emitter.emit("test");
			emitter.emit("test");
			expect(fn1).toHaveBeenCalledTimes(3);
			expect(fn2).toHaveBeenCalledOnce();
		});

		it("clears all subscriptions with clear()", () => {
			const fn1 = vi.fn();
			const fn2 = vi.fn();
			const emitter = new Emitter();
			emitter.on("test", fn1);
			emitter.on("test", fn2);
			emitter.clear();
			expect(fn1).not.toHaveBeenCalled();
			expect(fn2).not.toHaveBeenCalled();
		});
	});
});