import React from 'react';
import { shallow } from 'enzyme';
import {
  MySignupsList,
  Props,
} from 'client/views/my-games/components/MySignupsList';
import { SelectedGame } from 'shared/typings/models/user';

const signedGames: SelectedGame[] = [];

describe('MySignupsList', () => {
  it('should render correctly', () => {
    const props: Props = { signedGames };
    const component = shallow(<MySignupsList {...props} />);
    expect(component).toMatchSnapshot();
  });
});
