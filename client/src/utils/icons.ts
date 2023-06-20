import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faAngleUp as fasAngleUp,
  faAngleDown as fasAngleDown,
  faEye as fasEye,
  faEyeSlash as fasEyeSlash,
  faHeart as fasHeart,
  faBars as fasBars,
  faTimes as fasTimes,
  faComment as fasComment,
  faXmark as fasXmark,
  faCircleQuestion as fasCircleQuestion,
  faThermometerEmpty as fasThermometerEmpty,
  faThermometerHalf as fasThermometerHalf,
  faThermometerFull as fasThermometerFull,
  faQuestion as fasQuestion,
  faInfo as fasInfo,
  faCircleChevronLeft as fasCircleChevronLeft,
} from "@fortawesome/free-solid-svg-icons";
import {
  faHeart as farHeart,
  faComment as farComment,
} from "@fortawesome/free-regular-svg-icons";

export const getIconLibrary = (): void => {
  library.add(
    fasAngleUp,
    fasAngleDown,
    fasEye,
    fasEyeSlash,
    fasHeart,
    farHeart,
    fasBars,
    fasTimes,
    farComment,
    fasComment,
    fasXmark,
    fasCircleQuestion,
    fasThermometerEmpty,
    fasThermometerHalf,
    fasThermometerFull,
    fasQuestion,
    fasInfo,
    fasCircleChevronLeft
  );
};
