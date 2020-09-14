import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { SignupView } from '../SignupView';

describe('SignupView', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <SignupView />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
