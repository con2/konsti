import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faAngleUp,
  faAngleDown,
  faEye,
  faEyeSlash,
  faHeart,
} from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

export const getIconLibrary = (): void => {
  library.add(faAngleUp, faAngleDown, faEye, faEyeSlash, faHeart, far);
};
