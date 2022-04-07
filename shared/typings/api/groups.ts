import { z } from "zod";
import { SelectedGame } from "shared/typings/models/user";

export interface PostGroupResponse {
  groupCode: string;
  message: string;
  status: "success";
}

export interface GetGroupResponse {
  message: string;
  results: GroupMember[];
  status: "success";
}

export const GroupSchema = z.object({
  groupCode: z.string(),
  isGroupLeader: z.boolean(),
  ownSerial: z.string(),
  username: z.string(),
  leaveGroup: z.optional(z.boolean()),
  closeGroup: z.optional(z.boolean()),
});

export type Group = z.infer<typeof GroupSchema>;

export interface GroupMember {
  enteredGames: readonly SelectedGame[];
  groupCode: string;
  serial: string;
  signedGames: readonly SelectedGame[];
  username: string;
}
