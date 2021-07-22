import moment from 'moment';
import { Game } from 'shared/typings/models/game';
import { KompassiGame } from 'server/typings/game.typings';
import { KompassiProgramType } from 'shared/constants/kompassiProgramType';

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
      endTime:
        moment(game.end_time).format() ||
        moment(game.start_time).add(game.length, 'minutes').format(),
      people: game.formatted_hosts,
      minAttendance: game.min_players,
      maxAttendance: game.max_players || game.ropecon2018_characters,
      gameSystem: game.rpg_system,
      englishOk: game.english_ok ?? false,
      childrenFriendly: game.children_friendly ?? false,
      ageRestricted: game.age_restricted ?? false,
      beginnerFriendly:
        (game.beginner_friendly || game.is_beginner_friendly) ?? false,
      intendedForExperiencedParticipants:
        game.intended_for_experienced_participants ?? false,
      shortDescription: game.short_blurb || game.three_word_description,
      revolvingDoor: game.revolving_door,
      programType: mapProgramType(game.category_title),
      popularity: 0,
      contentWarnings: game.content_warnings ?? '',
      otherAuthor: game.other_author ?? '',
      accessibility: {
        loudSounds: game.ropecon2021_accessibility_loud_sounds,
        flashingLights: game.ropecon2021_accessibility_flashing_lights,
        strongSmells: game.ropecon2021_accessibility_strong_smells,
        irritateSkin: game.ropecon2021_accessibility_irritate_skin,
        physicalContact: game.ropecon2021_accessibility_physical_contact,
        lowLighting: game.ropecon2021_accessibility_low_lightning,
        movingAround: game.ropecon2021_accessibility_moving_around,
        video: game.ropecon2021_accessibility_video,
        recording: game.ropecon2021_accessibility_recording,
        text: game.ropecon2021_accessibility_text,
        colourblind: game.ropecon2021_accessibility_colourblind,
      },
    };
  });
};

const mapProgramType = (programType: string): string => {
  if (programType === KompassiProgramType.TABLETOP_RPG) return 'tabletopRPG';
  else if (programType === KompassiProgramType.FREEFORM_RPG)
    return 'freeformRPG';
  else if (programType === KompassiProgramType.LARP) return 'larp';
  else return 'unknown';
};
