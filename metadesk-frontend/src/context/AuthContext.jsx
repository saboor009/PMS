import { createContext, useContext, useReducer, useEffect } from 'react'
import api from '../services/api'
import { DEFAULT_PERMISSIONS } from '../utils/accessControl'

const AuthContext = createContext()

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.payload, isLoading: false }
    case 'LOGOUT': return { user: null, isLoading: false }
    case 'SET_LOADING': return { ...state, isLoading: action.payload }
    case 'UPDATE_USER': return { ...state, user: { ...state.user, ...action.payload } }
    default: return state
  }
}

const MOCK_USER = {
  _id: 'demo-001',
  name: 'Muhammad (Demo)',
  username: 'muhammad',
  email: 'demo@metadesk.com',
  role: 'ceo',
  permissions: DEFAULT_PERMISSIONS.ceo,
  team: 'Engineering',
  designation: 'CEO & Founder',
  avatar: '',
  avatarStyle: { face: '#F8C7A5', hair: '#1F2937', shirt: '#2F85C8', accessory: 'none' },
  isActive: true,
  approvalStatus: 'approved',
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { user: null, isLoading: true })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token === 'dev-preview') {
      dispatch({ type: 'SET_USER', payload: MOCK_USER })
      return
    }
    if (token) {
      api.get('/auth/me')
        .then(res => dispatch({ type: 'SET_USER', payload: res.data.user }))
        .catch(() => { localStorage.removeItem('token'); dispatch({ type: 'SET_LOADING', payload: false }) })
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const loginAsDemo = () => {
    localStorage.setItem('token', 'dev-preview')
    dispatch({ type: 'SET_USER', payload: MOCK_USER })
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    dispatch({ type: 'SET_USER', payload: res.data.user })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    dispatch({ type: 'LOGOUT' })
  }

  const updateUser = (data) => dispatch({ type: 'UPDATE_USER', payload: data })

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
