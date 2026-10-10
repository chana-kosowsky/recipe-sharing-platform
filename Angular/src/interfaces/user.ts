export interface User {
      id: number;
  username: string;
  email: string;
  password?: string;                // אופציונלי - לא תמיד מוחזר מהשרת
  role: 'Admin' | 'Uploader' | 'Reader'; // תפקיד
  is_approved_uploader: boolean;    // האם מאושר להעלות מתכונים
  upload_request_status?: 'none' | 'pending' | 'approved' | 'rejected';
  created_at: string;               // תאריך הצטרפות
}

