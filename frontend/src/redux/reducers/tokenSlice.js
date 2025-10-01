import { createSlice } from '@reduxjs/toolkit'

export const tokens = createSlice({
    name: 'tokens',
    initialState: {
        contracts : {},
        symbols: {},
        decimals: {},
        balances: {},
    },
    reducers: {
        setContracts:( state, action) => { 
            state.contracts = action.payload
        },
        setDecimals:( state, action) => { 
            state.decimals = action.payload
        },
        setSymbols:( state, action) => {
            state.symbols = action.payload
        },

        balancesLoaded: (state, action) => {
            state.balances = action.payload
        }
    }
})

export const { setContracts, setSymbols ,setDecimals,  balancesLoaded} = tokens.actions;
export default tokens.reducer;

// tokenSlice.js
export const selectUSDCContract = (state) => state.tokens.contracts.usdc;
export const selectUSDCReady = (state) => !!state.tokens.contracts.usdc?.functions?.balanceOf;

