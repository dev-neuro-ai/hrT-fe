// Mock user data
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@hrplatform.com',
    password: 'admin123', // In a real app, passwords would be hashed
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: '2',
    email: 'recruiter@hrplatform.com',
    password: 'recruiter123',
    name: 'Recruiter User',
    role: 'recruiter'
  }
] as const;

export async function authenticateUser(email: string, password: string) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}