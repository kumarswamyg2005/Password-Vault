export interface UserRecord {
  _id?: any;
  email: string;
  passwordHash: string;
  encSalt: string;
  encIterations: number;
  createdAt: Date;
}
