import { intGt, toInt } from "@shared/helpers/zodHelpers";
import z from "zod";

export const groupIdParamSchema = z.object({
	groupId: z.string().refine(...intGt(0)).transform(toInt),
});