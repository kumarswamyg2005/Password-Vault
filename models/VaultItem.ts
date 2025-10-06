export interface VaultItemRecord {
  _id?: any;
  userId: any;
  ciphertext: string;
  iv: string;
  createdAt: Date;
  updatedAt?: Date;
}
