import { LoginResponse } from '@/api/types/response';

export interface UserState extends Omit<LoginResponse, 'token' | 'userId'> {
  isLoggedIn: boolean;
  token: string | null;
  userId: string | null;
}
