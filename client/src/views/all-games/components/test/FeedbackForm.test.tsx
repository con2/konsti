import React from 'react';
import { shallow } from 'enzyme';
import { testGame } from 'test/test-data/testGame';
import { FeedbackForm, Props } from '../FeedbackForm';

describe('FeedbackForm', () => {
  it('should render correctly', () => {
    const props: Props = { game: testGame };
    const component = shallow(<FeedbackForm {...props} />);
    expect(component).toMatchSnapshot();
  });
});
