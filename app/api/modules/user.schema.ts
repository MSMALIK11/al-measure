import { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "client" | "admin" | "employee";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["client", "admin", "employee"], default: "client" },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);
export default User;

// 50+6
// 10+10+10+15