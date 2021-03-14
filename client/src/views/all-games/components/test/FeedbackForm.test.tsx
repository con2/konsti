import React from 'react';
import { shallow } from 'enzyme';
import { testGame } from 'client/test/test-data/testGame';
import {
  FeedbackForm,
  Props,
} from 'client/views/all-games/components/FeedbackForm';

describe('FeedbackForm', () => {
  it('should render correctly', () => {
    const props: Props = { game: testGame };
    const component = shallow(<FeedbackForm {...props} />);
    expect(component).toMatchSnapshot();
  });
});
