import { Express, Request, Response } from "express";
import { z } from "zod";
import { AuthEndpoint } from "shared/constants/apiEndpoints";
import { logger } from "server/utils/logger";

const baseUrl = process.env.KOMPASSI_BASE_URL ?? "https://kompassi.eu";
const clientId = process.env.KOMPASSI_CLIENT_ID ?? "";
const clientSecret = process.env.KOMPASSI_CLIENT_SECRET ?? "";
// const accessGroups = (process.env.KOMPASSI_ACCESS_GROUPS ?? "").split(/\s+/);
// const adminGroups = (process.env.KOMPASSI_ADMIN_GROUPS ?? "").split(/\s+/);
// const redirectUri = `${process.env.URL}/auth/kompassi.callback`;

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

  const response = await fetch(url, { headers });
  return response.json();
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

export const enableKompassiLogin = (app: Express): void => {
  app.get(AuthEndpoint.KOMPASSI_LOGIN, (req, res) => {
    if (!req.headers.origin) {
      return res.sendStatus(422);
    }

    res.status(302).json({
      location: getAuthUrl(req.headers.origin),
    });
  });

  app.post(AuthEndpoint.KOMPASSI_CALLBACK, (req, res) => {
    doLogin(req, res).catch(() => {});
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

  const response = await fetch(url, { method: "POST", body, headers });
  return response.json();
};

const PostSentryTunnelRequestSchema = z.object({ code: z.string() });

const doLogin = async (req: Request<{}, {}, string>, res: Response) => {
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

  const tokens = await getToken("" + code, req.headers.origin);
  const profile = await getProfile(tokens.access_token);

  // eslint-disable-next-line no-console
  console.log("profile", profile);

  /*

  const initials = `${profile.first_name[0]}${profile.surname[0]}`;
  const userHash = getHash(profile.full_name);
  */

  /*
  const groupNames: string[] = profile.groups.filter(
    (groupName) =>
      accessGroups.includes(groupName) || adminGroups.includes(groupName),
  );
  if (!groupNames.length) {
    // User not member of any group that would grant access
    res.redirect(`${process.env.URL}?notice=auth-error`);
    return;
  }
  const isAdmin = groupNames.some((groupName) =>
    adminGroups.includes(groupName),
  );

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
