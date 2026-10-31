import { createContext, useContext } from 'react';

export const NavCtx = createContext({ go: () => {}, toast: () => {}, params: {} });
export const useNav = () => useContext(NavCtx);
