import React from 'react';
import { shallow } from 'enzyme';
import { Accordion, Props } from 'client/components/Accordion';

const title = 'test title';
const text = 'test text';
const buttonText = 'test button text';

describe('Loading', () => {
  it('should render correctly', () => {
    const props: Props = { title, text, buttonText };
    const component = shallow(<Accordion {...props} />);
    expect(component).toMatchSnapshot();
  });
});
