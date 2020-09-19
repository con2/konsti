import commander from 'commander';
import { getUserStats } from './statistics-helpers/getUserStats';
import { getGameStats } from './statistics-helpers/getGameStats';
import { getResultsStats } from './statistics-helpers/getResultsStats';

const fixData = (): void => {
  commander
    .command('users <year> <event>')
    .description('Get user statisticss')
    .action(async (year, event) => {
      await getUserStats(year, event);
    });

  commander
    .command('games <year> <event>')
    .description('Get game statistics')
    .action(async (year, event) => {
      await getGameStats(year, event);
    });

  commander
    .command('results <year> <event>')
    .description('Get result statistics')
    .action(async (year, event) => {
      await getResultsStats(year, event);
    });

  if (process.argv.length < 4) {
    commander.help();
  }

  commander.parse(process.argv);
};

fixData();
