import { NumbersOfMaintanceCaratule } from "../company"
import { UserCaratule } from "../user"

export interface CodeCountries {
  country_code: string;
  country_name: string;
  phone_code: number;
}
export interface Conversation {
    id?: number;
    indicative: number;
    destination_number: string;
    start?: Date;
    end?: Date;
    user: UserCaratule,
    numberOfMaintance : NumbersOfMaintanceCaratule
    image? : string
    conversationid? : number
    phone: string;
  }

export interface ConversationCaratule {
  conversationid: number;
  destination_number: string;
  indicative: number;
  start: string;
  end: string;
  phone: string;
}
