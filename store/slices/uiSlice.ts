import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Toast = { id: string; message: string; tone: 'success' | 'error' | 'info' };

type UiState = {
  toasts: Toast[];
  mobileNavOpen: boolean;
  chatOpen: boolean;
  announcementBarClosed: boolean;
};

const initialState: UiState = {
  toasts: [],
  mobileNavOpen: false,
  chatOpen: false,
  announcementBarClosed: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    pushToast: {
      reducer(state, action: PayloadAction<Toast>) { state.toasts.push(action.payload); },
      prepare(message: string, tone: Toast['tone'] = 'info') {
        return { payload: { id: `t_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, message, tone } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) { state.mobileNavOpen = action.payload; },
    setChatOpen(state, action: PayloadAction<boolean>) { state.chatOpen = action.payload; },
    closeAnnouncementBar(state) { state.announcementBarClosed = true; },
  },
});

export const { pushToast, dismissToast, setMobileNavOpen, setChatOpen, closeAnnouncementBar } = uiSlice.actions;
export default uiSlice.reducer;
