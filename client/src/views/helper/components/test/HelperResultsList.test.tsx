import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { HelperResultsList } from '../HelperResultsList';

describe('HelperResultsList', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <HelperResultsList />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
