import { ReactElement } from "react";
import { ScrollToTopButton } from "client/components/ScrollToTopButton";
import KonstiFaq from "client/markdown/KonstiFaq.mdx";

export const FaqView = (): ReactElement => {
  return (
    <>
      <KonstiFaq />
      <ScrollToTopButton />
    </>
  );
};
