import jsonwebtoken, { SignOptions, TokenExpiredError } from "jsonwebtoken";
import { config } from "shared/config";
import { JWTBody, JWTBodySchema, JWTResponse } from "server/types/jwtTypes";
import { UserGroup } from "shared/types/models/user";

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
    const result = JWTBodySchema.parse(jwtBody);

    return {
      body: {
        username: result.username,
        userGroup: result.userGroup,
        iat: result.iat,
        exp: result.exp,
      },
      status: "success",
      message: "success",
    };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return {
        status: "error",
        message: "expired jwt",
        body: { username: "", userGroup: UserGroup.USER, iat: 0, exp: 0 },
      };
    }

    return {
      status: "error",
      message: "unknown jwt error",
      body: { username: "", userGroup: UserGroup.USER, iat: 0, exp: 0 },
    };
  }
};

// Be careful: this does not verify jwt signature
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
    case UserGroup.HELP: {
      return config.server().jwtSecretKeyHelp;
    }
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
