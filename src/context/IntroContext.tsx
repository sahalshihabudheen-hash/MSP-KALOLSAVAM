import { createContext, useContext } from 'react';

interface IntroContextType {
  introComplete: boolean;
}

export const IntroContext = createContext<IntroContextType>({ introComplete: false });
export const useIntro = () => useContext(IntroContext);
