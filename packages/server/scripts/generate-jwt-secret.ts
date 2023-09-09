#!/usr/bin/env tsx
import { randomBytes } from "crypto";
const secret = randomBytes(256).toString('base64');
console.log(secret);