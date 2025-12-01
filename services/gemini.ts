import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, DietPlanResponse, PlaceResult } from "../types";

// Using process.env.API_KEY as per instructions
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const dietPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    introduction: {
      type: Type.STRING,
      description: "A motivating introduction and summary of the plan in Turkish, referencing their BMI stats.",
    },
    analysis: {
      type: Type.OBJECT,
      description: "Mathematical analysis of calories and timeline.",
      properties: {
        maintenanceCalories: { type: Type.NUMBER, description: "Calculated TDEE (Total Daily Energy Expenditure)." },
        targetDailyCalories: { type: Type.NUMBER, description: "Recommended daily calorie intake for the goal." },
        dailyCalorieDifference: { type: Type.NUMBER, description: "The calorie deficit (negative) or surplus (positive) amount." },
        estimatedWeeksToGoal: { type: Type.NUMBER, description: "Estimated number of weeks to reach target weight based on the deficit/surplus." },
        message: { type: Type.STRING, description: "Short explanation of the math in Turkish (e.g. 'To lose X kg, you need a deficit of Y kcal...')" }
      },
      required: ["maintenanceCalories", "targetDailyCalories", "dailyCalorieDifference", "estimatedWeeksToGoal", "message"]
    },
    totalWeeklyCostEstimate: {
      type: Type.NUMBER,
      description: "Estimated total cost of the shopping list in Turkish Lira (TRY).",
    },
    weeklyShoppingList: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A consolidated list of ingredients needed for the whole week.",
    },
    weeklyPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "Day of the week (e.g., Pazartesi)" },
          totalCalories: { type: Type.NUMBER },
          estimatedCostTRY: { type: Type.NUMBER, description: "Estimated cost for this day in TRY" },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "Meal type (Kahvaltı, Öğle, Akşam, Ara)" },
                name: { type: Type.STRING },
                calories: { type: Type.NUMBER },
                recipe: { type: Type.STRING, description: "Short recipe instructions" },
                ingredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of ingredients with amounts"
                }
              },
              required: ["type", "name", "calories", "recipe", "ingredients"]
            }
          }
        },
        required: ["day", "totalCalories", "estimatedCostTRY", "meals"]
      }
    }
  },
  required: ["introduction", "analysis", "weeklyPlan", "weeklyShoppingList", "totalWeeklyCostEstimate"]
};

export const generateDietPlan = async (profile: UserProfile): Promise<DietPlanResponse> => {
  const model = "gemini-2.5-flash";
  
  // Calculate BMI to give context to Gemini
  const heightInMeters = profile.height / 100;
  const bmi = (profile.weight / (heightInMeters * heightInMeters)).toFixed(2);
  const weightDiff = Math.abs(profile.weight - profile.targetWeight).toFixed(1);

  const prompt = `
    Sen uzman bir diyetisyen, matematikçi ve beslenme koçusun. Aşağıdaki profil için 7 günlük kişiselleştirilmiş bir Türk mutfağına uygun diyet planı oluştur.
    
    Profil:
    - Yaş: ${profile.age}
    - Boy: ${profile.height} cm
    - Kilo: ${profile.weight} kg (VKİ: ${bmi})
    - Hedef Kilo: ${profile.targetWeight} kg (Fark: ${weightDiff} kg)
    - Cinsiyet: ${profile.gender}
    - Hedef: ${profile.goal}
    - Aktivite Seviyesi: ${profile.activityLevel}
    ${profile.dietaryRestrictions ? `- Kısıtlamalar: ${profile.dietaryRestrictions}` : ''}

    Görevler:
    1. Mifflin-St Jeor formülünü kullanarak BMR ve aktivite seviyesine göre TDEE (Günlük Enerji Harcaması) hesapla.
    2. Hedef belirleme:
       - Eğer hedef Kilo Vermek ise: Sağlıklı bir kalori açığı oluştur (Örn: -500 kcal).
       - Eğer hedef Kilo Almak ise: Sağlıklı bir kalori fazlalığı oluştur (Örn: +300 ila +500 kcal).
       - Eğer hedef Korumak ise: TDEE'ye eşit kalori ver.
    3. Süre Tahmini Hesaplama (Analysis Kısmı için):
       - Kilo Vermek için: (Hedeflenen Toplam Kayıp kg * 7700) / Günlük Açık = Gün sayısı. Bunu haftaya çevir.
       - Kilo Almak için: (Hedeflenen Toplam Kazanım kg * 7700) / Günlük Fazlalık = Gün sayısı. Bunu haftaya çevir.
       - Varsayım: 1 kg vücut değişimi ≈ 7700 kcal.
    4. "Analysis" objesi içinde bu sayısal verileri kesinlikle döndür.
    5. Yemek planı Türk damak tadına uygun olsun, malzemeler Türkiye'de bulunabilir olsun.
    6. Yanıt sadece JSON formatında olsun.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dietPlanSchema,
        systemInstruction: "You are a helpful Turkish Nutritionist AI. Output JSON only.",
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as DietPlanResponse;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Error generating diet plan:", error);
    throw error;
  }
};

export const findNearbyStores = async (lat: number, lng: number): Promise<PlaceResult[]> => {
  const model = "gemini-2.5-flash";
  const prompt = "Bulunduğum konuma yakın, uygun fiyatlı süpermarketleri, manavları ve organik pazarları listele. Adreslerini ve google maps linklerini ver.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      return chunks.map((chunk): PlaceResult | null => {
        if (chunk.maps) {
            return {
                title: chunk.maps.title || "Bilinmeyen Yer",
                uri: chunk.maps.uri || ""
            };
        }
        return null;
      }).filter((item): item is PlaceResult => item !== null);
    }
    
    return [];
  } catch (error) {
    console.error("Error finding stores:", error);
    return [];
  }
};