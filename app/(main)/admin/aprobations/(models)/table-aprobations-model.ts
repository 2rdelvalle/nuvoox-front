export interface NumbersToAprobate {
  id: number;
  indicative: number;
  number: string;
  status: string;
}
export interface TableAprobations {
  idCompany: number;
  nameCompany: string;
  QuantityNumbersToAprobate: number;
  numbersToAprobate: NumbersToAprobate[];
}
