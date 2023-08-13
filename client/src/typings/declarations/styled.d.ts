import "styled-components";
import { Theme } from "client/theme";

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface -- Required for theme TS support
  interface DefaultTheme extends Theme {}
}
