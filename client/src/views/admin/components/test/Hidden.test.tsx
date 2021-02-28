import React from 'react';
import { shallow } from 'enzyme';
import { Game } from 'shared/typings/game';
import { Hidden, Props } from 'client/views/admin/components/Hidden';

const hiddenGames: Game[] = [];

describe('Hidden', () => {
  it('should render correctly', () => {
    const props: Props = { hiddenGames };
    const component = shallow(<Hidden {...props} />);
    expect(component).toMatchSnapshot();
  });
});
