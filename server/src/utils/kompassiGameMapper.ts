import moment from 'moment';
import { KompassiGame, Game } from 'typings/game.typings';

export const kompassiGameMapper = (
  games: readonly KompassiGame[]
): readonly Game[] => {
  return games.map((game) => {
    return {
      gameId: game.identifier,
      title: game.title,
      description: game.description,
      location: game.room_name,
      startTime: moment(game.start_time).format(),
      mins: game.length,
      tags: game.tags,
      genres: game.genres,
      styles: game.styles,
      language: game.language,
      endTime: moment(game.start_time).add(game.length, 'minutes').format(),
      people: game.formatted_hosts,
      minAttendance: game.min_players,
      maxAttendance: game.max_players,
      gameSystem: game.rpg_system,
      englishOk: game.english_ok,
      childrenFriendly: game.children_friendly,
      ageRestricted: game.age_restricted,
      beginnerFriendly: game.beginner_friendly || game.is_beginner_friendly,
      intendedForExperiencedParticipants:
        game.intended_for_experienced_participants,
      shortDescription: game.short_blurb || game.three_word_description,
      revolvingDoor: game.revolving_door,
      programType: mapProgramType(game.category_title),
      popularity: 0,
    };
  });
};

const mapProgramType = (programType: string): string => {
  if (programType === 'Roolipeli') return 'tabletopRPG';
  else if (programType === 'Freeform') return 'freeformRPG';
  else return 'unknown';
};
