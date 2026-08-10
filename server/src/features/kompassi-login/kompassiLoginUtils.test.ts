import { expect, test, describe } from "vitest";
import {
  addKompassiIdSuffix,
  deriveKonstiUsername,
} from "server/features/kompassi-login/kompassiLoginUtils";
import { KompassiUserinfo } from "server/features/kompassi-login/KompassiLoginTypes";
import { USERNAME_LENGTH_MAX } from "shared/constants/validation";

const userinfo: KompassiUserinfo = {
  sub: "42",
  email: "firstname.lastname@example.com",
  name: 'Firstname "Nickname" Surname',
  given_name: "Firstname",
  family_name: "Surname",
  groups: ["users"],
};

describe("deriveKonstiUsername", () => {
  test("should use the nick quoted in the name claim", () => {
    expect(deriveKonstiUsername(userinfo)).toEqual("Nickname");
  });

  test("should fall back to the given name when the name has no quoted nick", () => {
    expect(
      deriveKonstiUsername({ ...userinfo, name: "Firstname Surname" }),
    ).toEqual("Firstname");
  });

  test("should fall back to the email local part without a given name", () => {
    expect(
      deriveKonstiUsername({ ...userinfo, name: "", given_name: "" }),
    ).toEqual("firstname.lastname");
  });

  test("should fall back to the Kompassi id when no claim yields a name", () => {
    expect(
      deriveKonstiUsername({
        ...userinfo,
        name: "",
        given_name: "",
        email: "",
      }),
    ).toEqual("kompassi-42");
  });

  // The finalize form rejects anything outside these bounds, and it prefills
  // whatever is derived here
  test("should skip a candidate that is too short for the form to accept", () => {
    expect(
      deriveKonstiUsername({ ...userinfo, name: 'Firstname "Jo" Surname' }),
    ).toEqual("Firstname");
  });

  test("should not derive a username longer than the maximum", () => {
    const derived = deriveKonstiUsername({
      ...userinfo,
      name: `Firstname "${"n".repeat(50)}" Surname`,
    });
    expect(derived).toHaveLength(USERNAME_LENGTH_MAX);
  });
});

describe("addKompassiIdSuffix", () => {
  test("should append the Kompassi id", () => {
    expect(addKompassiIdSuffix("Nickname", "42")).toEqual("Nickname-42");
  });

  // Trimming the suffix instead would make the fallback non-unique, which is
  // the only thing it is there for
  test("should keep the whole suffix when the name fills the length budget", () => {
    const suffixed = addKompassiIdSuffix("n".repeat(USERNAME_LENGTH_MAX), "42");
    expect(suffixed).toHaveLength(USERNAME_LENGTH_MAX);
    expect(suffixed.endsWith("-42")).toEqual(true);
  });
});
