const SHORT_DESCRIPTION_MAX_LENGTH = 200;
const matchNextSentence = /([.?!])\s*(?=[A-Z])/g;

export const getShortDescriptionFromDescription = (
  description: string,
): string => {
  let shortDescription = "";

  const descriptionArray = description
    .replace(matchNextSentence, "$1|")
    .split("|");

  for (const value of descriptionArray) {
    shortDescription = shortDescription.concat(`${value} `);
    if (shortDescription.length >= SHORT_DESCRIPTION_MAX_LENGTH) {
      break;
    }
  }
  return shortDescription;
};
