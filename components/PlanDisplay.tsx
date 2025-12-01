import React, { useState, useMemo } from 'react';
import { DietPlanResponse, PlaceResult, UserProfile } from '../types';
import { ChevronDown, ChevronUp, MapPin, ChefHat, Info, ShoppingCart, DollarSign, Flame, Calendar, Activity, Scale, X, CheckCircle2, TrendingDown, TrendingUp, Clock, Calculator } from 'lucide-react';
import { findNearbyStores } from '../services/gemini';

interface Props {
  plan: DietPlanResponse;
  userProfile: UserProfile;
}

const PlanDisplay: React.FC<Props> = ({ plan, userProfile }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [stores, setStores] = useState<PlaceResult[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [showFullShoppingList, setShowFullShoppingList] = useState(false);

  const activeDay = plan.weeklyPlan[activeDayIndex];

  // Recalculate stats for display
  const stats = useMemo(() => {
    const heightInMeters = userProfile.height / 100;
    const bmi = userProfile.weight / (heightInMeters * heightInMeters);
    const minWeight = 18.5 * (heightInMeters * heightInMeters);
    const maxWeight = 24.9 * (heightInMeters * heightInMeters);
    
    let status = 'Normal';
    if (bmi < 18.5) status = 'Zayıf';
    else if (bmi >= 25 && bmi < 29.9) status = 'Fazla Kilolu';
    else if (bmi >= 30) status = 'Obez';

    return {
        bmi: bmi.toFixed(1),
        status,
        minWeight: minWeight.toFixed(1),
        maxWeight: maxWeight.toFixed(1),
        diffToMin: (minWeight - userProfile.weight).toFixed(1),
        diffToMax: (userProfile.weight - maxWeight).toFixed(1)
    }
  }, [userProfile]);


  const toggleMeal = (mealName: string) => {
    if (expandedMeal === mealName) {
      setExpandedMeal(null);
    } else {
      setExpandedMeal(mealName);
    }
  };

  const handleFindStores = async () => {
    setLoadingStores(true);
    setStoreError(null);
    if (!navigator.geolocation) {
      setStoreError("Tarayıcınız konum servisini desteklemiyor.");
      setLoadingStores(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const results = await findNearbyStores(latitude, longitude);
        setStores(results);
        setLoadingStores(false);
      },
      (error) => {
        console.error(error);
        setStoreError("Konum alınamadı. Lütfen izin verdiğinizden emin olun.");
        setLoadingStores(false);
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative">
      
      {/* Shopping List Modal */}
      {showFullShoppingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <ShoppingCart className="mr-2 text-emerald-600" /> Haftalık Alışveriş Listesi
              </h3>
              <button 
                onClick={() => setShowFullShoppingList(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-200 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <ul className="space-y-3">
                {plan.weeklyShoppingList.map((item, idx) => (
                  <li key={idx} className="flex items-start p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition group">
                    <CheckCircle2 size={18} className="mr-3 text-emerald-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl text-center">
               <button 
                  onClick={() => setShowFullShoppingList(false)}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition"
               >
                 Listeyi Kapat
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis & Timeline Card (NEW) */}
      {plan.analysis && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Calculator className="mr-2 text-purple-600" /> Hedef ve Süre Analizi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Calorie Math */}
                  <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                          <span>Günlük İhtiyaç (Korumak İçin)</span>
                          <span className="font-bold">{plan.analysis.maintenanceCalories} kcal</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                          <span>Diyet Hedefi</span>
                          <span className="font-bold text-emerald-600">{plan.analysis.targetDailyCalories} kcal</span>
                      </div>
                      
                      {/* Visual Bar */}
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                          {/* Background Marker for Maintenance */}
                          <div 
                             className="h-full bg-gray-300 absolute top-0 left-0"
                             style={{width: '100%'}} 
                          ></div>
                          
                          {/* Active Bar */}
                          <div 
                             className={`h-full absolute top-0 left-0 transition-all duration-1000 ${plan.analysis.dailyCalorieDifference < 0 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                             style={{width: `${Math.min(100, (plan.analysis.targetDailyCalories / Math.max(plan.analysis.maintenanceCalories, plan.analysis.targetDailyCalories)) * 100)}%`}}
                          ></div>
                      </div>

                      <div className="flex items-start bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mt-2">
                           {plan.analysis.dailyCalorieDifference < 0 ? (
                               <TrendingDown className="text-emerald-500 mr-2 flex-shrink-0" size={18} />
                           ) : (
                               <TrendingUp className="text-orange-500 mr-2 flex-shrink-0" size={18} />
                           )}
                           <p>
                               {Math.abs(plan.analysis.dailyCalorieDifference)} kcal 
                               {plan.analysis.dailyCalorieDifference < 0 ? ' açık oluşturuluyor.' : ' hacim kazanımı için fazladan alınıyor (Bulk).'}
                               <br/>
                               <span className="text-xs text-gray-500">{plan.analysis.message}</span>
                           </p>
                      </div>
                  </div>

                  {/* Time Estimate */}
                  <div className="flex flex-col items-center justify-center bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <Clock className="text-purple-600 mb-2" size={32} />
                      <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Tahmini Süre</p>
                      <h4 className="text-4xl font-extrabold text-purple-700 my-1">
                          {plan.analysis.estimatedWeeksToGoal}
                      </h4>
                      <p className="text-purple-600 font-medium">Hafta</p>
                      <p className="text-xs text-center text-purple-400 mt-2 px-4">
                          *Bu listeye sadık kalındığında hedefe ulaşma süresidir.
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* Health Stats Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm">Vücut Kitle İndeksi</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.bmi}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                    stats.status === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                    {stats.status}
                </span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-full">
                <Activity className="text-emerald-600" size={24} />
            </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm">Mevcut / Hedef</p>
                <div className="flex items-end space-x-2">
                    <h3 className="text-2xl font-bold text-gray-800">{userProfile.weight} <span className="text-sm font-normal text-gray-500">kg</span></h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                   İdeal Aralık: <span className="font-medium">{stats.minWeight} - {stats.maxWeight} kg</span>
                </p>
            </div>
             <div className="bg-blue-50 p-3 rounded-full">
                <Scale className="text-blue-600" size={24} />
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
             <p className="text-gray-500 text-sm mb-1">Öneri</p>
             <p className="text-sm font-medium text-gray-700">
                {Number(stats.bmi) < 18.5 && `Sağlıklı yaşam için ${stats.diffToMin} kg almalısınız.`}
                {Number(stats.bmi) > 24.9 && `Sağlıklı yaşam için ${stats.diffToMax} kg vermelisiniz.`}
                {Number(stats.bmi) >= 18.5 && Number(stats.bmi) <= 24.9 && "Mevcut kilonuz gayet sağlıklı!"}
             </p>
        </div>
      </div>

      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Info className="mr-2" /> Diyetisyen Notu
        </h2>
        <p className="leading-relaxed opacity-90 text-lg">
          {plan.introduction}
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
             <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center">
                <DollarSign size={18} className="mr-1" />
                <span className="font-semibold">Haftalık: {plan.totalWeeklyCostEstimate} TL</span>
             </div>
             <button 
               onClick={() => setShowFullShoppingList(true)}
               className="bg-white/20 hover:bg-white/30 transition backdrop-blur-sm rounded-lg px-4 py-2 flex items-center cursor-pointer"
             >
                 <ShoppingCart size={18} className="mr-1" />
                 <span className="font-semibold">{plan.weeklyShoppingList.length} Malzeme Listesi</span>
             </button>
        </div>
      </div>

      {/* Days Navigation */}
      <div className="flex overflow-x-auto pb-4 space-x-2 scrollbar-hide">
        {plan.weeklyPlan.map((day, index) => (
          <button
            key={index}
            onClick={() => setActiveDayIndex(index)}
            className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeDayIndex === index
                ? 'bg-emerald-600 text-white shadow-md transform scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {day.day}
          </button>
        ))}
      </div>

      {/* Daily View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Meals Column */}
        <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-2">
                 <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Calendar className="mr-2 text-emerald-600"/> {activeDay.day} Menüsü
                 </h3>
                 <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                     ~{activeDay.totalCalories} kcal / {activeDay.estimatedCostTRY} TL
                 </div>
            </div>
         
          {activeDay.meals.map((meal, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <button
                onClick={() => toggleMeal(meal.name)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div>
                  <div className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-1">
                    {meal.type}
                  </div>
                  <div className="text-lg font-bold text-gray-800">{meal.name}</div>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Flame size={14} className="mr-1 text-orange-500" /> {meal.calories} kcal
                  </div>
                </div>
                {expandedMeal === meal.name ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
              </button>

              {expandedMeal === meal.name && (
                <div className="px-5 pb-5 pt-0 bg-gray-50/50 border-t border-gray-100">
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                        <ShoppingBasketIcon className="w-4 h-4 mr-1 text-blue-500"/> Malzemeler
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        {meal.ingredients.map((ing, i) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                        <ChefHat className="w-4 h-4 mr-1 text-orange-500"/> Tarif
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {meal.recipe}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar: Shopping & Locations */}
        <div className="space-y-6">
          
          {/* Shopping List Summary */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center">
                    <ShoppingCart className="mr-2 text-emerald-600" size={20}/> Alışveriş Özeti
                </h3>
                <button 
                    onClick={() => setShowFullShoppingList(true)}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                    Tümünü Gör
                </button>
             </div>
             
             <p className="text-sm text-gray-500 mb-3">Bu haftanın genel ihtiyaçlarından bazıları:</p>
             <div className="flex flex-wrap gap-2">
                 {plan.weeklyShoppingList.slice(0, 8).map((item, i) => (
                     <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                         {item}
                     </span>
                 ))}
                 {plan.weeklyShoppingList.length > 8 && (
                     <button 
                        onClick={() => setShowFullShoppingList(true)}
                        className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium hover:bg-emerald-200 transition"
                     >
                         +{plan.weeklyShoppingList.length - 8} daha
                     </button>
                 )}
             </div>
          </div>

          {/* Location Finder */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                <MapPin className="mr-2" size={20}/> Malzemeleri Nerede Bulurum?
            </h3>
            <p className="text-sm text-blue-700 mb-4">
                Konumuna yakın en iyi marketleri ve pazarları bulmak için tıkla.
            </p>
            
            {stores.length === 0 && !loadingStores && (
                <button
                    onClick={handleFindStores}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >
                    Marketleri Bul
                </button>
            )}

            {loadingStores && (
                 <div className="text-center py-4 text-blue-600 text-sm animate-pulse">
                     Konum alınıyor ve marketler aranıyor...
                 </div>
            )}

            {storeError && (
                <div className="text-red-500 text-sm mt-2">{storeError}</div>
            )}

            {stores.length > 0 && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {stores.map((store, idx) => (
                        <a 
                            key={idx} 
                            href={store.uri} 
                            target="_blank" 
                            rel="noreferrer"
                            className="block bg-white p-3 rounded border border-blue-100 hover:border-blue-300 transition group"
                        >
                            <div className="font-semibold text-gray-800 group-hover:text-blue-600 text-sm">
                                {store.title}
                            </div>
                            <div className="text-xs text-blue-500 flex items-center mt-1">
                                Haritada gör <span className="ml-1">→</span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const ShoppingBasketIcon = ({className}:{className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m5 11 4-7"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.7-7.4"/><path d="m9 11 1 9"/><path d="m4.5 11 .1 9"/><path d="m15 11-1 9"/></svg>
)

export default PlanDisplay;