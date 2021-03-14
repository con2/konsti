import express, { Request, Response } from 'express';
import { postUserValidation, postLoginValidation } from 'server/api/validation';
import { postGames, getGames } from 'server/api/controllers/gamesController';
import { postUser, getUser } from 'server/api/controllers/userController';
import { postLogin } from 'server/api/controllers/loginController';
import { postAssignment } from 'server/api/controllers/assignmentController';
import { postSignup } from 'server/api/controllers/signupController';
import { postFavorite } from 'server/api/controllers/favoriteController';
import { postHidden } from 'server/api/controllers/hiddenController';
import { postSignupTime } from 'server/api/controllers/signuptimeController';
import { postFeedback } from 'server/api/controllers/feedbackController';
import { getSettings } from 'server/api/controllers/settingsController';
import { getResults } from 'server/api/controllers/resultsController';
import { postGroup, getGroup } from 'server/api/controllers/groupController';
import { toggleAppOpen } from 'server/api/controllers/toggleAppOpenController';
import { validateAuthHeader } from 'server/utils/authHeader';
import { UserGroup } from 'server/typings/user.typings';

export const apiRoutes = express.Router();

/* eslint-disable @typescript-eslint/no-misused-promises */
apiRoutes.post('/games', async (req: Request, res: Response) => {
  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = postGames();
  return res.send(response);
});

apiRoutes.post('/user', postUserValidation, postUser);
apiRoutes.post('/login', postLoginValidation, postLogin);
apiRoutes.post('/assignment', postAssignment);
apiRoutes.post('/signup', postSignup);
apiRoutes.post('/favorite', postFavorite);
apiRoutes.post('/hidden', postHidden);
apiRoutes.post('/signuptime', postSignupTime);
apiRoutes.post('/feedback', postFeedback);
apiRoutes.post('/group', postGroup);
apiRoutes.post('/toggle-app-open', toggleAppOpen);

apiRoutes.get('/games', async (_req: Request, res: Response) => {
  const response = await getGames();
  return res.send(response);
});

apiRoutes.get('/user', getUser);
apiRoutes.get('/settings', getSettings);
apiRoutes.get('/results', getResults);
apiRoutes.get('/group', getGroup);
/* eslint-enable @typescript-eslint/no-misused-promises */
