import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

type DashboardState = {
  briefs: any[];
  invoices: any[];
  bookings: any[];
  loading: { briefs: boolean; invoices: boolean; bookings: boolean };
};

const initialState: DashboardState = {
  briefs: [],
  invoices: [],
  bookings: [],
  loading: { briefs: false, invoices: false, bookings: false },
};

export const fetchBriefs   = createAsyncThunk('dashboard/briefs',   async () => (await fetch('/api/projects')).json());
export const fetchInvoices = createAsyncThunk('dashboard/invoices', async () => (await fetch('/api/invoices')).json());
export const fetchBookings = createAsyncThunk('dashboard/bookings', async () => (await fetch('/api/bookings')).json());

const slice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    upsertBrief(state, action) {
      const idx = state.briefs.findIndex((b) => b._id === action.payload._id);
      if (idx >= 0) state.briefs[idx] = action.payload;
      else state.briefs.unshift(action.payload);
    },
    upsertInvoice(state, action) {
      const idx = state.invoices.findIndex((b) => b._id === action.payload._id);
      if (idx >= 0) state.invoices[idx] = action.payload;
      else state.invoices.unshift(action.payload);
    },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchBriefs.pending,   (s) => { s.loading.briefs = true; })
      .addCase(fetchBriefs.fulfilled, (s, a) => { s.loading.briefs = false; s.briefs = a.payload?.items || []; })
      .addCase(fetchBriefs.rejected,  (s) => { s.loading.briefs = false; })
      .addCase(fetchInvoices.pending,   (s) => { s.loading.invoices = true; })
      .addCase(fetchInvoices.fulfilled, (s, a) => { s.loading.invoices = false; s.invoices = a.payload?.items || []; })
      .addCase(fetchInvoices.rejected,  (s) => { s.loading.invoices = false; })
      .addCase(fetchBookings.pending,   (s) => { s.loading.bookings = true; })
      .addCase(fetchBookings.fulfilled, (s, a) => { s.loading.bookings = false; s.bookings = a.payload?.items || []; })
      .addCase(fetchBookings.rejected,  (s) => { s.loading.bookings = false; });
  },
});

export const { upsertBrief, upsertInvoice } = slice.actions;
export default slice.reducer;
