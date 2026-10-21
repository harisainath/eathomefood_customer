import { createNavigationContainerRef } from '@react-navigation/native';

/** Lets code outside screens (e.g. a tapped notification) open a screen. */
export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) navigationRef.navigate(name, params);
}
