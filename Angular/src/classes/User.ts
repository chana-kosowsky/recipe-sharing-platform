export class User {
  constructor(
    public password: string = '',    // ← ערך ברירת מחדל ריק
    public username: string = '',    // ← ערך ברירת מחדל ריק
    public email: string = '',       // ← ערך ברירת מחדל ריק
    public role: string = 'Reader',
    public is_approved_uploader: boolean = false
  ) {}
}

