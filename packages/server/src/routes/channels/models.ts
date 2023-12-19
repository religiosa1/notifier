import { intGt, toInt } from "@shared/helpers/zodHelpers";
import z from "zod";

export const channelIdRoute = z.object({
	channelId: z.string().refine(...intGt(0)).transform(toInt)
});