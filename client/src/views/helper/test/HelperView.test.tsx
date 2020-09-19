import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { HelperView } from '../HelperView';

describe('HelperView', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <HelperView />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
