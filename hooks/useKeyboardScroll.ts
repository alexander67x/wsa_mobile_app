import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, findNodeHandle } from 'react-native';
import type { NativeSyntheticEvent, ScrollView, TextInputFocusEventData } from 'react-native';

export function useKeyboardScroll(offset = 32, extraPadding = 24) {
  const scrollRef = useRef<ScrollView>(null);
  const lastFocusedHandleRef = useRef<number | null>(null);
  const [keyboardPadding, setKeyboardPadding] = useState(extraPadding);

  const scrollToFocused = useCallback(() => {
    const scrollView = scrollRef.current;
    const nodeHandle = lastFocusedHandleRef.current;
    if (!scrollView || !nodeHandle || !scrollView.scrollResponderScrollNativeHandleToKeyboard) return;
    scrollView.scrollResponderScrollNativeHandleToKeyboard(nodeHandle, offset, true);
  }, [offset]);

  useEffect(() => {
    const handleShow = (e: any) => {
      const height = e?.endCoordinates?.height || 0;
      setKeyboardPadding(height + extraPadding);
      requestAnimationFrame(scrollToFocused);
    };
    const handleHide = () => setKeyboardPadding(extraPadding);

    const willShow = Keyboard.addListener('keyboardWillShow', handleShow);
    const didShow = Keyboard.addListener('keyboardDidShow', handleShow);
    const willHide = Keyboard.addListener('keyboardWillHide', handleHide);
    const didHide = Keyboard.addListener('keyboardDidHide', handleHide);
    return () => {
      willShow.remove();
      didShow.remove();
      willHide.remove();
      didHide.remove();
    };
  }, [extraPadding, scrollToFocused]);

  const handleInputFocus = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      const nodeHandle = event?.target ? findNodeHandle(event.target) : null;
      lastFocusedHandleRef.current = typeof nodeHandle === 'number' ? nodeHandle : null;
      requestAnimationFrame(scrollToFocused);
    },
    [scrollToFocused]
  );

  return { scrollRef, handleInputFocus, keyboardPadding };
}
