import { createSlice } from '@reduxjs/toolkit'

export const providerSlice = createSlice({
    name: 'provider',
    initialState: {
        connection : null,
        chainId: null,
        account: null,
    },
    reducers: {
        setProvider: (state, action) => {
            state.connection = action.payload
        },
        setNetwork: (state, action) => {
            state.chainId = action.payload
        },
        setAccount: (state, action) => {
            state.account = action.payload
        }
    }
})

export const { setProvider, setNetwork, setAccount } = providerSlice.actions;
export default providerSlice.reducer;
