import { describe, it, expect, vi } from "vitest";
import { strict as assert } from "node:assert";
import { DiContainer } from "src/util/DiContainer";

describe("DiContainer", () => {
	it("allows dependency injection on the preconfigured container", () => {
		const cb = vi.fn();
		const di = new DiContainer({
			foo: () => cb
		});

		const injected = di.inject("foo");
		injected();

		expect(cb).toBeCalledTimes(1);
	});

	it("initializes dependencies in a lazy fashion", () => {
		const initializer = vi.fn(() => "foo");
		const di = new DiContainer({ foo: initializer });
		expect(initializer).not.toBeCalled();
		di.inject("foo");
		expect(initializer).toBeCalledTimes(1);
	});

	it("keeps the previous initialization result", () => {
		const initializer = vi.fn(() => ({}));
		const di = new DiContainer({ foo: initializer });
		const obj1 = di.inject("foo");
		const obj2 = di.inject("foo");
		const obj3 = di.inject("foo");
		expect(initializer).toBeCalledTimes(1);
		expect(obj1).toBe(obj2);
		expect(obj1).toBe(obj3);
	});

	it("disposes depencies on close", async () => {
		const cb = vi.fn();
		const acb = vi.fn(async () => {});
		const ncb = vi.fn();
		const di = new DiContainer({
			foo: () => ({ [Symbol.dispose]: cb }),
			bar: () => ({ [Symbol.asyncDispose]: acb }),
			biz: () => ({ [Symbol.dispose]: ncb }),
		});
		di.inject("foo");
		di.inject("bar");
		await di.close();

		expect(cb).toBeCalledTimes(1);
		expect(acb).toBeCalledTimes(1);
		expect(ncb).not.toBeCalled();
	});

	it("allows to clone a diContainer, copying initializer, but not initialized deps", () => {
		const initializer = vi.fn(() => ({}));
		const di = new DiContainer({
			foo: initializer
		});
		const obj1 = di.inject("foo");
		const obj2 = di.inject("foo");
		expect(initializer).toBeCalledTimes(1);
		const diClone = di.clone();
		expect(initializer).toBeCalledTimes(1);
		const obj3 = diClone.inject("foo");
		expect(initializer).toBeCalledTimes(2);

		expect(obj1).toBe(obj2);
		expect(obj1).not.toBe(obj3);
	});

	it("same di.inject returns separate di instances for cloned containers in separate AsyncContexts", async () => {
		let counter = 1;

		const di = new DiContainer({
			foo: () => counter++
		});

		const createExecutor = (timeout: number) => async () => {
			//  immediately calling, to avoid race in lazy init and we can definitively say what's the return value
			const a = di.inject("foo");
			await new Promise(res => setTimeout(res, timeout));
			const b = di.inject("foo");
			assert(a === b, "injected values before and after pause must be equal");
			return b;
		};		

		const results = await Promise.all([
			createExecutor(30)(),
			di.clone().run(createExecutor(50)),
			di.clone().run(createExecutor(40)),
		]);
	
		expect(results).toEqual([1, 2, 3]);
	});
});