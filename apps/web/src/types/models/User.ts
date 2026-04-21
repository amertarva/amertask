export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string; // 1-2 huruf untuk avatar fallback
}
