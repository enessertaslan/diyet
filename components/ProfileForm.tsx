import React, { useState, useMemo } from 'react';
import { UserProfile, Gender, Goal, ActivityLevel } from '../types';
import { Target, Activity, Ruler, Weight, User, Calculator, ArrowRight, Flag } from 'lucide-react';

interface Props {
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
}

const ProfileForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [profile, setProfile] = useState<UserProfile>({
    age: 25,
    height: 170,
    weight: 70,
    targetWeight: 65,
    gender: Gender.FEMALE,
    goal: Goal.LOSE_WEIGHT,
    activityLevel: ActivityLevel.MODERATE,
    dietaryRestrictions: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(profile);
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // BMI Calculation Logic
  const bmiStats = useMemo(() => {
    if (!profile.height || !profile.weight) return null;
    
    const heightInMeters = profile.height / 100;
    const bmi = profile.weight / (heightInMeters * heightInMeters);
    
    let status = '';
    let color = '';
    
    if (bmi < 18.5) {
      status = 'Zayıf';
      color = 'text-blue-500';
    } else if (bmi >= 18.5 && bmi < 24.9) {
      status = 'Normal Kilolu';
      color = 'text-green-500';
    } else if (bmi >= 25 && bmi < 29.9) {
      status = 'Fazla Kilolu';
      color = 'text-orange-500';
    } else {
      status = 'Obez';
      color = 'text-red-500';
    }

    // Healthy weight range (BMI 18.5 - 24.9)
    const minWeight = 18.5 * (heightInMeters * heightInMeters);
    const maxWeight = 24.9 * (heightInMeters * heightInMeters);
    
    let suggestion = '';
    if (bmi < 18.5) {
        suggestion = `Sağlıklı aralığa girmek için en az ${(minWeight - profile.weight).toFixed(1)} kg almalısınız.`;
    } else if (bmi > 24.9) {
        suggestion = `Sağlıklı aralığa girmek için en az ${(profile.weight - maxWeight).toFixed(1)} kg vermelisiniz.`;
    } else {
        suggestion = "Kilonuz sağlıklı aralıkta. Formunuzu koruyun!";
    }

    return {
      bmi: bmi.toFixed(1),
      status,
      color,
      range: `${minWeight.toFixed(1)} - ${maxWeight.toFixed(1)} kg`,
      suggestion
    };
  }, [profile.height, profile.weight]);

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Profilini Oluştur</h2>
        <p className="text-gray-500">Sana en uygun planı hazırlayabilmemiz için bilgilerin gerekli.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <User size={16} className="mr-2 text-emerald-500" /> Yaş
            </label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => handleChange('age', Number(e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Ruler size={16} className="mr-2 text-emerald-500" /> Boy (cm)
            </label>
            <input
              type="number"
              value={profile.height}
              onChange={(e) => handleChange('height', Number(e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Weight size={16} className="mr-2 text-emerald-500" /> Mevcut Kilo (kg)
            </label>
            <input
              type="number"
              value={profile.weight}
              onChange={(e) => handleChange('weight', Number(e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Flag size={16} className="mr-2 text-emerald-500" /> Hedef Kilo (kg)
            </label>
            <input
              type="number"
              value={profile.targetWeight}
              onChange={(e) => handleChange('targetWeight', Number(e.target.value))}
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
        </div>

        {/* Live BMI Analysis Card */}
        {bmiStats && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700 flex items-center">
                        <Calculator size={18} className="mr-2 text-gray-500"/> Vücut Analizi
                    </h3>
                    <span className={`font-bold ${bmiStats.color} px-3 py-1 bg-white rounded-full text-sm border shadow-sm`}>
                        VKİ: {bmiStats.bmi} - {bmiStats.status}
                    </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                        <span>İdeal Kilo Aralığınız:</span>
                        <span className="font-medium text-gray-900">{bmiStats.range}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-200 flex items-start text-emerald-700 font-medium">
                        <ArrowRight size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                        {bmiStats.suggestion}
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cinsiyet</label>
                <div className="flex space-x-2">
                    {Object.values(Gender).map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => handleChange('gender', g)}
                            className={`flex-1 py-2 px-4 rounded-lg border transition ${
                                profile.gender === g 
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-medium' 
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Target size={16} className="mr-2 text-emerald-500" /> Hedef
                </label>
                <select
                    value={profile.goal}
                    onChange={(e) => handleChange('goal', e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                    {Object.values(Goal).map((g) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
             <Activity size={16} className="mr-2 text-emerald-500" /> Aktivite Seviyesi
          </label>
          <select
            value={profile.activityLevel}
            onChange={(e) => handleChange('activityLevel', e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            {Object.values(ActivityLevel).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Varsa Diyet Kısıtlamaları / Alerjiler</label>
          <textarea
            value={profile.dietaryRestrictions}
            onChange={(e) => handleChange('dietaryRestrictions', e.target.value)}
            placeholder="Örn: Gluten intoleransı, fıstık alerjisi, vegan..."
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition h-20 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transform transition hover:-translate-y-1 ${
            isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
          }`}
        >
          {isLoading ? (
             <span className="flex items-center justify-center">
               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Plan Hazırlanıyor...
             </span>
          ) : 'Diyet Planımı Oluştur'}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;