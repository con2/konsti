import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'client/utils/store';
import { App } from 'client/app/App';

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
