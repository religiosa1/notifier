#!/usr/bin/env tsx
/** Script for manually generating passwords for API keys */
import readline from "readline";
import { hash } from "src/Authorization/hash";
import { Writable } from "stream";

class MutableStdout extends Writable {
	muted = false;

	override write(chunk: any, encoding?: BufferEncoding | ((error: Error | null | undefined) => void), callback?: (error: Error | null | undefined) => void): boolean {
		if (encoding instanceof Function) {
			callback = encoding;
			encoding = "utf-8";
		}
		if (!this.muted) {
			return process.stdout.write(chunk, encoding, callback);
		}
		callback?.(null);
		return true;
	}
}

const mtstdout = new MutableStdout();
const rl = readline.createInterface({
	input: process.stdin,
	output: mtstdout,
	terminal: true
});

rl.question('Enter the password: ', (pwd) => {
	mtstdout.muted = false;
	hash(pwd).then((salted) => {
		rl.write(salted)
		rl.close();
	});
});
mtstdout.muted = true;


rl.on('close', function () {
	process.exit(0);
});