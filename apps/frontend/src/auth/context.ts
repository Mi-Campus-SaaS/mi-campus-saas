import { createContext } from 'react'

export type Role = 'student' | 'parent' | 'teacher' | 'admin'

export type User = { id: string; username: string; role: Role; displayName: string }

export type AuthContextType = {
  user?: User | null
  token?: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
}

export const AuthContext = createContext<AuthContextType>(defaultAuthContext)


