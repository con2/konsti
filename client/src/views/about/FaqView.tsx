import { ReactElement } from "react";
import KonstiFaq from "client/markdown/KonstiFaq.mdx";
import { ScrollToTopButton } from "client/components/ScrollToTopButton";

export const FaqView = (): ReactElement => {
  return (
    <>
      <KonstiFaq />
      <ScrollToTopButton />
    </>
  );
};
