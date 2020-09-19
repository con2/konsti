interface serialGenerator {
  generate: (count: number) => string;
}

const generator: serialGenerator = jest.genMockFromModule(
  'generate-serial-number'
);

const serials: string[] = [
  'a1234',
  'a1234',
  'b5225',
  'c2512',
  'a1234', // this is a duplicate and should not be saved
  'd1232',
  'a1234',
  'b5225',
  'c2512',
  'a1234', // this is a duplicate and should not be saved
  'd1232',
  'e12039',
  'f1259105',
];

let ind = -1;

function _nextArrayElement(arr: string[]): string {
  ind += 1;
  return arr[ind];
}

function generate(count: number): string {
  return _nextArrayElement(serials);
}

generator.generate = generate;

module.exports = generator;
