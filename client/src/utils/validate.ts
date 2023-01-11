import { t } from "i18next";
import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
} from "shared/constants/validation";

export const passwordLength = (value: string): string | null => {
  if (value.length < PASSWORD_LENGTH_MIN)
    return t("validation.tooShort", { length: PASSWORD_LENGTH_MIN });
  if (value.length > PASSWORD_LENGTH_MAX)
    return t("validation.tooLong", { length: PASSWORD_LENGTH_MAX });
  return null;
};
