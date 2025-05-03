interface CompanyCaratuleForm {
    companyId: number;
  }

  interface UserCaratuleForm {
      userId: number;
  }
export interface GroupAgent {
    name: string;
    company: CompanyCaratuleForm;
    userCompanyGroup: UserCaratuleForm[];
  }
