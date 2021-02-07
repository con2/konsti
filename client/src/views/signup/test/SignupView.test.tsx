import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'utils/store';
import { SignupView } from 'views/signup/SignupView';

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
