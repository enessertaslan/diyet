export enum Gender {
  MALE = 'Erkek',
  FEMALE = 'Kadın',
}

export enum Goal {
  LOSE_WEIGHT = 'Kilo Vermek',
  MAINTAIN = 'Kiloyu Korumak',
  GAIN_WEIGHT = 'Kilo Almak',
}

export enum ActivityLevel {
  SEDENTARY = 'Hareketsiz (Masa başı)',
  LIGHT = 'Az Hareketli (Haftada 1-3 gün spor)',
  MODERATE = 'Orta Hareketli (Haftada 3-5 gün spor)',
  ACTIVE = 'Çok Hareketli (Haftada 6-7 gün spor)',
}

export interface User {
  name: string;
  email: string;
  password: string; // In a real app, never store plain text passwords!
}

export interface UserProfile {
  age: number;
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg
  gender: Gender;
  goal: Goal;
  activityLevel: ActivityLevel;
  dietaryRestrictions?: string;
}

export interface WeightEntry {
  date: string; // ISO String
  weight: number;
}

export interface Meal {
  type: 'Kahvaltı' | 'Öğle Yemeği' | 'Akşam Yemeği' | 'Ara Öğün';
  name: string;
  calories: number;
  recipe: string;
  ingredients: string[];
}

export interface DailyPlan {
  day: string;
  totalCalories: number;
  estimatedCostTRY: number;
  meals: Meal[];
}

export interface PlanAnalysis {
  maintenanceCalories: number; // TDEE
  targetDailyCalories: number;
  dailyCalorieDifference: number; // Deficit or Surplus
  estimatedWeeksToGoal: number;
  message: string;
}

export interface DietPlanResponse {
  introduction: string;
  analysis: PlanAnalysis; // New Analysis Section
  weeklyPlan: DailyPlan[];
  weeklyShoppingList: string[];
  totalWeeklyCostEstimate: number;
  timestamp?: number; // To track when the plan was created
}

export interface PlaceResult {
  title: string;
  address?: string;
  uri?: string;
}