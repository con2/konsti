import { Request, Response } from "express";
import { z } from "zod";
import axios from "axios";
import { AuthEndpoint } from "shared/constants/apiEndpoints";
import { logger } from "server/utils/logger";
import { PostLoginError, PostLoginResponse } from "shared/typings/api/login";
import { UserGroup } from "shared/typings/models/user";

const baseUrl = process.env.KOMPASSI_BASE_URL ?? "https://kompassi.eu";
const clientId = process.env.KOMPASSI_CLIENT_ID ?? "";
const clientSecret = process.env.KOMPASSI_CLIENT_SECRET ?? "";

const accessGroups = ["users"];
const adminGroups = ["admin"];

interface Profile {
  id: number;
  first_name: string;
  surname: string;
  full_name: string;
  groups: string[];
  email: string;
  username: string;
}

const getProfile = async (accessToken: string): Promise<Profile> => {
  const url = `${baseUrl}/api/v2/people/me`;

  const headers = { authorization: `Bearer ${accessToken}` };

  const response = await axios.get(url, { headers });
  return response.data;
};

const scope = "read";
// const providerName = "kompassi";
// const enabled = !!clientId;

const getAuthUrl = (origin: string): string => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_CALLBACK}`,
    scope,
  });

  return `${baseUrl}/oauth2/authorize?${params.toString()}`;
};

export const sendKompassiLoginRedirect = (
  req: Request<{}, {}, {}>,
  res: Response,
): Response => {
  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  return res.status(302).json({
    location: getAuthUrl(req.headers.origin),
  });
};

interface Token {
  access_token: string;
  refresh_token: string;
}

const getToken = async (code: string, origin: string): Promise<Token> => {
  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_CALLBACK}`,
  });
  const body = params.toString();
  const url = `${baseUrl}/oauth2/token`;
  const headers = {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
  };

  const response = await axios.post(url, body, { headers });
  return response.data;
};

const PostSentryTunnelRequestSchema = z.object({ code: z.string() });

export const doLogin = async (
  req: Request<{}, {}, string>,
  res: Response,
): Promise<Response> => {
  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  const result = PostSentryTunnelRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating doLogin query: ${result.error}`),
    );
    return res.sendStatus(422);
  }
  const { code } = result.data;

  const tokens = await getToken(code, req.headers.origin);
  const profile = await getProfile(tokens.access_token);

  const response = parseProfile(profile);
  return res.json(response);
};

const parseProfile = (profile: Profile): PostLoginResponse | PostLoginError => {
  const groupNames = profile.groups.filter(
    (groupName) =>
      accessGroups.includes(groupName) || adminGroups.includes(groupName),
  );

  if (groupNames.length === 0) {
    return {
      message: "User not member of any group that would grant access",
      status: "error",
      errorId: "invalidUserGroup",
    };
  }

  const isAdmin = groupNames.some((groupName) =>
    adminGroups.includes(groupName),
  );

  return {
    status: "success",
    groupCode: "string",
    jwt: "string",
    message: "string",
    serial: "string",
    userGroup: isAdmin ? UserGroup.ADMIN : UserGroup.USER,
    username: "string",
    eventLogItems: [],
  };

  /*
  const { user, team, isNewUser, isNewTeam } = await accountProvisioner({
    ip: req.ip,
    team: {
      name: teamName,
      domain: "",
      subdomain: "",
    },
    user: {
      name: profile.full_name,
      email: profile.email,
    },
    authenticationProvider: {
      name: providerName,
      providerId: teamName,
    },
    authentication: {
      providerId: "" + profile.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scopes: scope.split(/\s+/),
    },
  });

  // update adminship
  if (user.isAdmin !== isAdmin) {
    user.isAdmin = isAdmin;
    await user.save();
  }

  // update group membership
  const groupIds: string[] = [];
  for (const groupName of groupNames) {
    // Ensure the groups exist that the user should be member of per Kompassi
    const [group] = await Group.findOrCreate({
      where: {
        teamId: team.id,
        name: groupName,
      },
      defaults: {
        createdById: user.id,
      },
    });

    groupIds.push(group.id);

    // Ensure membership
    await GroupUser.findOrCreate({
      where: {
        userId: user.id,
        groupId: group.id,
      },
      defaults: {
        createdById: user.id,
      },
    });
  }

  // Delete group memberships that are no longer valid per Kompassi
  // NOTE: Not scoped to team, would also delete memberships of other teams
  // But self hosted Outline is single team only so this is fine.
  await GroupUser.destroy({
    where: {
      userId: user.id,
      groupId: {
        [Op.notIn]: groupIds,
      },
    },
  });

  // set cookies on response and redirect to team subdomain
  await signIn(ctx, user, team, "local", isNewUser, isNewTeam);
  */
};
