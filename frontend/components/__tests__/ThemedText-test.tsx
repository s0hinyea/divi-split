import * as React from 'react';
import renderer, { act } from 'react-test-renderer';

import { ThemedText } from '../ThemedText';

it('renders correctly', () => {
  let component: renderer.ReactTestRenderer;

  act(() => {
    component = renderer.create(<ThemedText>Snapshot test!</ThemedText>);
  });

  expect(component!.toJSON()).toMatchSnapshot();
});
