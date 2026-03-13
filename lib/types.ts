export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  cohort: string;
  submitted_at: string | null;
  created_at: string;
}

export interface Module {
  id: number;
  title: string;
  description: string;
}

export interface CaseStudy {
  id: number;
  module_id: number;
  title: string;
  scenario: string;
  questions: string;
  sort_order: number;
}

export interface Response {
  id: number;
  user_id: number;
  case_study_id: number;
  content: string;
  updated_at: string;
}

export interface UserProgress {
  user: User;
  total_cases: number;
  completed_cases: number;
}

export interface ModuleWithProgress {
  module: Module;
  caseStudies: (CaseStudy & { hasResponse: boolean })[];
}
