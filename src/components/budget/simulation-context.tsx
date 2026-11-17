"use client"

import { createContext, useContext } from "react"

export const SimulationContext = createContext(false)
export const useSimulation = () => useContext(SimulationContext)
