import jsonwebtoken, { TokenExpiredError } from "jsonwebtoken";
import { config } from "server/config";
import { JWTResult } from "server/typings/jwt.typings";
import { UserGroup } from "shared/typings/models/user";

export const getJWT = (userGroup: UserGroup, username: string): string => {
  const payload = {
    username,
    userGroup,
  };

  const options = {
    expiresIn: "14 days",
  };

  return jsonwebtoken.sign(payload, getSecret(userGroup), options);
};

export const verifyJWT = (
  jwt: string,
  userGroup: UserGroup,
  username: string
): JWTResult => {
  let result;
  try {
    result = jsonwebtoken.verify(jwt, getSecret(userGroup)) as JWTResult;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return {
        status: "error",
        message: "expired jwt",
        username: "",
        userGroup: "",
        iat: 0,
        exp: 0,
      };
    }
  }

  if (result?.username === username)
    return {
      username: result.username,
      userGroup: result.userGroup,
      iat: result.iat,
      exp: result.exp,
      status: "success",
      message: "success",
    };

  return {
    status: "error",
    message: "unknown jwt error",
    username: "",
    userGroup: "",
    iat: 0,
    exp: 0,
  };
};

export const decodeJWT = (jwt: string): JWTResult => {
  return jsonwebtoken.decode(jwt) as JWTResult;
};

const getSecret = (userGroup: UserGroup): string => {
  if (userGroup === UserGroup.ADMIN) {
    return config.jwtSecretKeyAdmin;
  } else if (userGroup === UserGroup.USER) {
    return config.jwtSecretKey;
  } else if (userGroup === UserGroup.HELP) {
    return config.jwtSecretKeyHelp;
  }
  return "";
};

export const getJwtResponse = (
  jwt: string,
  requiredUserGroup: UserGroup | UserGroup[],
  username: string
): JWTResult => {
  if (Array.isArray(requiredUserGroup)) {
    const responses = requiredUserGroup.map((userGroup) => {
      return verifyJWT(jwt, userGroup, username);
    });

    return (
      responses.find((response) => response.status === "success") ??
      responses[0]
    );
  }

  return verifyJWT(jwt, requiredUserGroup, username);
};
