import api from './api'

/**
 * Register a new user
 * @param {{ name, email, department, year, password, confirmPassword }} data
 * @returns {{ success, token, user, message }}
 */
export const registerUser = async (data) => {
  const response = await api.post('auth/register', data)
  return response.data
}

/**
 * Login with email + password
 * @param {{ email, password }} data
 * @returns {{ success, token, user, message }}
 */
export const loginUser = async (data) => {
  const response = await api.post('auth/login', data)
  return response.data
}

/**
 * Fetch the current authenticated user's profile
 * (token is auto-attached by Axios interceptor)
 * @returns {{ success, user }}
 */
export const getProfile = async () => {
  const response = await api.get('auth/profile')
  return response.data
}

/**
 * Update the user's profile (including optional profilePic)
 * @param {FormData} formData
 * @returns {{ success, user, message }}
 */
export const updateProfile = async (formData) => {
  const response = await api.put('auth/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}
