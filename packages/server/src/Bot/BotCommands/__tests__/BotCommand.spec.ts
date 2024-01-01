import { describe, it, expect, vi } from "vitest";
import { BotCommandError } from "src/Bot/BotCommands/BotErrors";
import { BotCommand } from "../BotCommand";

describe("BotCommand", () => {
	const mockHandler = vi.fn();
	const cmd = new BotCommand(
		"test",
		"test command",
		mockHandler,
		["some", "args"],
	);

	const noArgsCmd = new BotCommand(
		"test",
		"test command without arguments",
		mockHandler,
	);

	it("checks that the command is in the correct format (word-like identifier)", () => {
		expect(() => new BotCommand("test", "test command", mockHandler)).not.toThrow();
		expect(() => new BotCommand("1test", "test command", mockHandler)).toThrow();
		expect(() => new BotCommand("te st", "test command", mockHandler)).toThrow();
		expect(() => new BotCommand("te-st", "test command", mockHandler)).toThrow();
	});

	it("checks that the args identifiers are the correct format", () => {
		expect(() => new BotCommand("test", "test command", mockHandler, ["foo", "bar"])).not.toThrow();
		expect(() => new BotCommand("test", "test command", mockHandler, ["foo", "1bar"])).toThrow();
		expect(() => new BotCommand("test", "test command", mockHandler, ["foo", "b ar"])).toThrow();
		expect(() => new BotCommand("test", "test command", mockHandler, ["foo", "bяar"])).toThrow();
	});

	it("returns the correct pattern for the command", () => {
		let re = cmd.pattern;
		expect(re).toBeInstanceOf(RegExp);
		expect(re.test("/test")).toBeTruthy();
		expect(re.test("/testd")).toBeFalsy();
		expect(re.test("/test 123")).toBeTruthy();
		expect(re.test("/test 123 321")).toBeTruthy();
		expect(re.test("/test 123 321 123")).toBeTruthy();
		// no args
		re = noArgsCmd.pattern;
		expect(re.test("/test")).toBeTruthy();
		expect(re.test("/testd")).toBeFalsy();
		expect(re.test("/test 123")).toBeTruthy();
	});

	it("correctly packs argument in re groups", () => {
		const testInp = "/test 123 321 67";
		const args = cmd.extractArgs(testInp.match(cmd.pattern));
		expect(args[0]).toBe("123");
		expect(args[1]).toBe("321");
		expect(args.length).toBe(2);
	});

	it("ignores redundant input for cmds without args", () => {
		const testInp = "/test 123 321 67";
		const args = noArgsCmd.extractArgs(testInp.match(noArgsCmd.pattern));
		expect(args.length).toBe(0);
	});

	it("throw an BotCommandError if there's an insufficient amount of args", () => {
		const testInp = "/test 123";
		expect(() => cmd.extractArgs(testInp.match(cmd.pattern))).toThrow(BotCommandError);
		expect(() => cmd.extractArgs((testInp + " 321").match(cmd.pattern))).not.toThrow();
	});

	it("provides data in the format expected by telegram", () => {
		expect(cmd.toTelegramCommand()).toEqual({
			command: "test",
			description: "test command",
		});
	});

	it("returns a usage string", () => {
		expect(cmd.usageString).toBe("/test <SOME> <ARGS>");
	});
});