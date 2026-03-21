export const STYLE_OPTIONS = [
  "简约",
  "通勤",
  "约会",
  "休闲",
  "街头",
  "韩系",
  "老钱风",
  "禁欲风",
  "美式复古",
  "甜酷",
] as const;

export type StyleOption = (typeof STYLE_OPTIONS)[number];

export type UserProfile = {
  gender: string;
  height: string;
  weight: string;
  preferences: string;
};

export type UploadedImage = {
  dataUrl: string;
  name: string;
  mimeType: string;
};

export type OutfitFormState = {
  scene: string;
  location: string;
  style: StyleOption;
  userProfile: UserProfile;
  uploadedImage: UploadedImage | null;
};

export type OutfitRecommendation = {
  id: string;
  top: string;
  bottom: string;
  shoes: string;
  tags: string[];
  score?: number;
  explanation: string;
};

export type ImageAnalysis = {
  summary: string;
  detectedStyle: string;
  colors: string[];
  items: string[];
  sceneHint: string;
};

export type WeatherInfo = {
  locationName: string;
  temperature: number;
  apparentTemperature: number;
  weatherLabel: string;
  precipitation: number;
  umbrellaNeeded: boolean;
  advice: string;
};

export type FeedbackValue = "like" | "dislike";

export type RecommendationFeedback = {
  id: string;
  scene: string;
  style: StyleOption;
  top: string;
  bottom: string;
  shoes: string;
  value: FeedbackValue;
  createdAt: string;
};

export type RecommendOutfitsRequest = {
  form: OutfitFormState;
  requestVersion: number;
  feedbackContext: string[];
};

export type RecommendOutfitsResponse = {
  recommendations: OutfitRecommendation[];
  imageAnalysis: ImageAnalysis | null;
  weather: WeatherInfo | null;
};

export type StreamExplanationRequest = {
  form: OutfitFormState;
  recommendation: OutfitRecommendation;
};

export type GenerateExampleImageRequest = {
  form: OutfitFormState;
  recommendation: OutfitRecommendation;
};

export type GenerateExampleImageResponse = {
  imageUrl: string;
  revisedPrompt: string | null;
};

export type HistoryEntry = Omit<OutfitFormState, "uploadedImage"> & {
  id: string;
  createdAt: string;
  imageName?: string;
};
