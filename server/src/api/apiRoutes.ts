import express from 'express';
import { postUserValidation, postLoginValidation } from 'api/validation';
import { postGames, getGames } from 'api/controllers/gamesController';
import { postUser, getUser } from 'api/controllers/userController';
import { postLogin } from 'api/controllers/loginController';
import { postAssignment } from 'api/controllers/assignmentController';
import { postSignup } from 'api/controllers/signupController';
import { postFavorite } from 'api/controllers/favoriteController';
import { postHidden } from 'api/controllers/hiddenController';
import { postSignupTime } from 'api/controllers/signuptimeController';
import { postFeedback } from 'api/controllers/feedbackController';
import { getSettings } from 'api/controllers/settingsController';
import { getResults } from 'api/controllers/resultsController';
import { postGroup, getGroup } from 'api/controllers/groupController';
import { toggleAppOpen } from 'api/controllers/toggleAppOpenController';

export const apiRoutes = express.Router();

apiRoutes.post('/games', postGames);
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

apiRoutes.get('/games', getGames);
apiRoutes.get('/user', getUser);
apiRoutes.get('/settings', getSettings);
apiRoutes.get('/results', getResults);
apiRoutes.get('/group', getGroup);
