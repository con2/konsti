import "styled-components";
import { Theme } from "client/theme";

declare module "styled-components" {
  interface DefaultTheme extends Theme {}
}
