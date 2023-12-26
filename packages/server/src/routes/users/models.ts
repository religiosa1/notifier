import { z } from "zod";
import { intGt, toInt } from "@shared/helpers/zodHelpers";

export const userIdParamsSchema = z.object({
	userId: z.string().refine(...intGt(0)).transform(toInt)
});
