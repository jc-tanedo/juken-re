import { useContext } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

const ZERO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

export default function useSafeInsets() {
  return useContext(SafeAreaInsetsContext) || ZERO_INSETS;
}
