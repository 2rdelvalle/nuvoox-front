import { UserCaratule } from "../user"

export interface auth {
    mail: string;
    password: string;
}

export interface JWTAuth {
    user: UserCaratule;
    iat: number;
    exp: number;
  }
