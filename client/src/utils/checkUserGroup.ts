import { UserGroup } from "shared/types/models/user";

export const isUser = (userGroup: UserGroup): boolean => {
  return userGroup === UserGroup.USER;
};

export const isAdmin = (userGroup: UserGroup): boolean => {
  return userGroup === UserGroup.ADMIN;
};

export const isAdminOrHelp = (userGroup: UserGroup): boolean => {
  return userGroup === UserGroup.ADMIN || userGroup === UserGroup.HELP;
};
