import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

type CurrencyState = {
  rate: number | null;
  source: string | null;
  fetchedAt: number | null;
  loading: boolean;
};

const initialState: CurrencyState = {
  rate: null,
  source: null,
  fetchedAt: null,
  loading: false,
};

export const fetchRate = createAsyncThunk('currency/fetch', async () => {
  const r = await fetch('/api/rate');
  const d = await r.json();
  return d as { rate: number; source: string; fetchedAt: number };
});

const slice = createSlice({
  name: 'currency',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRate.pending, (s) => { s.loading = true; })
      .addCase(fetchRate.fulfilled, (s, a) => {
        s.loading = false;
        s.rate = a.payload.rate;
        s.source = a.payload.source;
        s.fetchedAt = Date.now();
      })
      .addCase(fetchRate.rejected, (s) => { s.loading = false; });
  },
});

export default slice.reducer;
