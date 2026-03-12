export const endpoints = {
  signUp: "/auth/signup",
  signIn: "/auth/signin",
  signOut: "/auth/signout",
  authMe: "/auth/me",
  users: "/users",
  getUser: "/user",
  checkhealth: "/health",
  requests: "/requests",
  requestById: (id: string) => `/requests/${id}`,
  requestShare: (id: string) => `/requests/${id}/share`,
  shareByToken: (token: string) => `/share/${token}`,
};