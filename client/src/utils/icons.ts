import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faAngleUp,
  faAngleDown,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';

export const getIconLibrary = (): void => {
  library.add(faAngleUp, faAngleDown, faEye, faEyeSlash);
};
