export interface RecommendationRecord {
  id: number;
  mode: string;
  job_id: number;
  candidate_cv_id: number | null;
  application_id: number | null;
  overall_score: number;
  semantic_score: number;
  skill_match_score: number;
  experience_score: number;
  location_score: number;
  salary_score: number;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string;
  status: string;
}

export interface EnrichedRecommendation extends RecommendationRecord {
  job_title: string;
  company_name: string;
  company_logo: string | null;
  location_city: string;
  salary_range: {
    min: number | null;
    max: number | null;
  };
  applied: boolean;
  saved: boolean;
}

export interface RecommendationResponse {
  candidate_id: number;
  source_candidate_id: number;
  total: number;
  matches: EnrichedRecommendation[];
}
