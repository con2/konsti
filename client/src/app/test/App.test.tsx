import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { App } from '../App';

describe('App', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <App />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
