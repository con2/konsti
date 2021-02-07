import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'utils/store';
import { HelperResultsList } from 'views/helper/components/HelperResultsList';

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
