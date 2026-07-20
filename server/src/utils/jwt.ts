import jsonwebtoken from "jsonwebtoken";
const { TokenExpiredError } = jsonwebtoken;
type SignOptions = jsonwebtoken.SignOptions;
import { config } from "shared/config";
import { JWTBody, JWTBodySchema, JWTResponse } from "server/types/jwtTypes";
import { UserGroup } from "shared/types/models/user";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { logger } from "server/utils/logger";

export const getJWT = (userGroup: UserGroup, username: string): string => {
  const payload = {
    username,
    userGroup,
  };

  const options: SignOptions = {
    expiresIn: "14 days",
  };

  return jsonwebtoken.sign(payload, getSecret(userGroup), options);
};

export const verifyJWT = (jwt: string, userGroup: UserGroup): JWTResponse => {
  try {
    const jwtBody = jsonwebtoken.verify(jwt, getSecret(userGroup));
    const result = JWTBodySchema.safeParse(jwtBody);
    if (!result.success) {
      // A valid signature with an invalid body means we created a bad JWT -
      // log it, unlike tampered tokens which are just noise
      logger.error(
        new Error("Error validating JWT body", { cause: result.error }),
      );
      return {
        status: "error",
        message: "Unknown JWT error",
        body: { username: "", userGroup: UserGroup.USER, iat: 0, exp: 0 },
      };
    }

    return {
      body: {
        username: result.data.username,
        userGroup: result.data.userGroup,
        iat: result.data.iat,
        exp: result.data.exp,
      },
      status: "success",
      message: "success",
    };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return {
        status: "error",
        message: "Expired JWT",
        body: { username: "", userGroup: UserGroup.USER, iat: 0, exp: 0 },
      };
    }

    return {
      status: "error",
      message: "Unknown JWT error",
      body: { username: "", userGroup: UserGroup.USER, iat: 0, exp: 0 },
    };
  }
};

// Be careful: this does not verify JWT signature
export const decodeJWT = (jwt: string): JWTBody | null => {
  const decodedJwt = jsonwebtoken.decode(jwt);
  const result = JWTBodySchema.safeParse(decodedJwt);
  if (!result.success) {
    return null;
  }
  return result.data;
};

const getSecret = (userGroup: UserGroup): string => {
  switch (userGroup) {
    case UserGroup.ADMIN: {
      return config.server().jwtSecretKeyAdmin;
    }
    case UserGroup.USER: {
      return config.server().jwtSecretKey;
    }
    case UserGroup.HELPER: {
      return config.server().jwtSecretKeyHelp;
    }
    default:
      return exhaustiveSwitchGuard(userGroup);
  }
};

export const getJwtResponse = (
  jwt: string,
  requiredUserGroup: UserGroup | UserGroup[],
): JWTResponse => {
  if (Array.isArray(requiredUserGroup)) {
    const responses = requiredUserGroup.map((userGroup) => {
      return verifyJWT(jwt, userGroup);
    });

    return (
      responses.find((response) => response.status === "success") ??
      responses[0]
    );
  }

  return verifyJWT(jwt, requiredUserGroup);
};
