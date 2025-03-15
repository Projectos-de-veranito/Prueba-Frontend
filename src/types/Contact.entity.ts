import { User } from "./User.entity";

export interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  status: "pending" | "accepted" | "blocked";
  users?: User;
}
