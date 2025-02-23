const SHORT_DESCRIPTION_MAX_LENGTH = 200;
const matchNextSentence = /([.?!])\s*(?=[A-Z])/g;

export const getShortDescriptionFromDescription = (
  description: string,
): string => {
  let shortDescription = "";

  const sentences = description.replaceAll(matchNextSentence, "$1|").split("|");

  for (const sentence of sentences) {
    // eslint-disable-next-line unicorn/prefer-spread -- False positive
    shortDescription = shortDescription.concat(`${sentence} `);
    if (shortDescription.length >= SHORT_DESCRIPTION_MAX_LENGTH) {
      break;
    }
  }
  return shortDescription;
};
