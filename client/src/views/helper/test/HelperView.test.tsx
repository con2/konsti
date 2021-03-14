import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'client/utils/store';
import { HelperView } from 'client/views/helper/HelperView';

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
