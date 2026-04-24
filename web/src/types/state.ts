import { LoginResponse } from '#types/shared/response';

export interface UserState extends Omit<LoginResponse, 'token' | 'userId'> {
  isLoggedIn: boolean;
  token: string | null;
  userId: string | null;
}
