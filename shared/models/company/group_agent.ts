interface CompanyCaratuleForm {
    companyId: number;
  }

  interface UserCaratuleForm {
      userId: number;
  }
export interface GroupAgent {
    id?: number;
    companyGroupUserid?: number; // Posible ID alternativo
    name: string;
    company: CompanyCaratuleForm;
    userCompanyGroup: UserCaratuleForm[];
  }
