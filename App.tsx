import React, { useState, useEffect } from 'react';
import { UserProfile, DietPlanResponse, User } from './types';
import { generateDietPlan } from './services/gemini';
import ProfileForm from './components/ProfileForm';
import PlanDisplay from './components/PlanDisplay';
import WeightTracker from './components/WeightTracker';
import AuthForm from './components/AuthForm';
import { Leaf, RefreshCcw, LogOut, UserCircle, CalendarClock } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<DietPlanResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekExpired, setWeekExpired] = useState(false);

  // Check if a user session exists on mount
  useEffect(() => {
    const sessionEmail = localStorage.getItem('diet_app_session_email');
    if (sessionEmail) {
      const usersStr = localStorage.getItem('diet_app_users');
      if (usersStr) {
        const users: User[] = JSON.parse(usersStr);
        const foundUser = users.find(u => u.email === sessionEmail);
        if (foundUser) {
          handleLogin(foundUser);
        }
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('diet_app_session_email', user.email);

    // Load data specific to this user
    const profileKey = `diet_app_profile_${user.email}`;
    const planKey = `diet_app_plan_${user.email}`;

    const savedProfile = localStorage.getItem(profileKey);
    const savedPlan = localStorage.getItem(planKey);

    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    else setUserProfile(null);

    if (savedPlan) {
        const parsedPlan: DietPlanResponse = JSON.parse(savedPlan);
        setPlan(parsedPlan);
        checkPlanExpiry(parsedPlan);
    } else {
        setPlan(null);
    }
  };

  const checkPlanExpiry = (currentPlan: DietPlanResponse) => {
      if (currentPlan.timestamp) {
          const planDate = new Date(currentPlan.timestamp);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - planDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 7) {
              setWeekExpired(true);
          }
      }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserProfile(null);
    setPlan(null);
    setWeekExpired(false);
    localStorage.removeItem('diet_app_session_email');
  };

  const handleProfileSubmit = async (profile: UserProfile) => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setUserProfile(profile);
    
    // Save profile with user-specific key
    localStorage.setItem(`diet_app_profile_${currentUser.email}`, JSON.stringify(profile));
    
    try {
      const generatedPlan = await generateDietPlan(profile);
      const planWithTimestamp = { ...generatedPlan, timestamp: Date.now() };
      
      setPlan(planWithTimestamp);
      setWeekExpired(false);
      // Save plan with user-specific key
      localStorage.setItem(`diet_app_plan_${currentUser.email}`, JSON.stringify(planWithTimestamp));
    } catch (err) {
      setError("Diyet planı oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCurrentWeight = (newWeight: number) => {
    if (userProfile && currentUser) {
        const updatedProfile = { ...userProfile, weight: newWeight };
        setUserProfile(updatedProfile);
        localStorage.setItem(`diet_app_profile_${currentUser.email}`, JSON.stringify(updatedProfile));
    }
  };

  const handleReset = () => {
    if (!currentUser) return;
    if (window.confirm("Mevcut planı ve profili silmek istediğinize emin misiniz?")) {
        setPlan(null);
        setUserProfile(null);
        setError(null);
        setWeekExpired(false);
        localStorage.removeItem(`diet_app_profile_${currentUser.email}`);
        localStorage.removeItem(`diet_app_plan_${currentUser.email}`);
        localStorage.removeItem(`diet_app_weight_history_${currentUser.email}`);
    }
  };

  const handleNewPlan = async () => {
      if (userProfile && currentUser) {
          const confirmMsg = weekExpired 
             ? "Haftalık süreniz doldu! Güncel kilonuzla yeni bir plan oluşturulsun mu?" 
             : "Mevcut profilinize göre yeni bir plan oluşturulacak. Emin misiniz?";

          if (window.confirm(confirmMsg)) {
              setLoading(true);
              setWeekExpired(false);
              try {
                  const generatedPlan = await generateDietPlan(userProfile);
                  const planWithTimestamp = { ...generatedPlan, timestamp: Date.now() };
                  setPlan(planWithTimestamp);
                  localStorage.setItem(`diet_app_plan_${currentUser.email}`, JSON.stringify(planWithTimestamp));
              } catch (err) {
                  setError("Plan yenilenirken hata oluştu.");
              } finally {
                  setLoading(false);
              }
          }
      }
  };

  // If not logged in, show Auth Screen
  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-100 p-2 rounded-full">
               <Leaf className="text-emerald-600" size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 hidden sm:block">
              Akıllı Diyet Asistanı
            </h1>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 sm:hidden">
              ADA
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <UserCircle size={16} className="mr-2 text-emerald-600" />
                <span className="max-w-[100px] truncate">{currentUser.name}</span>
            </div>

            {plan && (
                <button 
                onClick={handleNewPlan}
                className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    weekExpired 
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 animate-pulse' 
                    : 'bg-emerald-50 text-emerald-600 hover:text-emerald-700'
                }`}
                title="Planı Yenile"
                >
                <RefreshCcw size={16} className="mr-1" /> <span className="hidden sm:inline">{weekExpired ? 'Yeni Hafta Planla' : 'Yenile'}</span>
                </button>
            )}
            
            <button 
                onClick={handleLogout}
                className="flex items-center text-sm font-medium text-gray-400 hover:text-red-500 px-2 py-1.5 transition"
                title="Çıkış Yap"
            >
                <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Weekly Expiry Notification */}
        {weekExpired && plan && !loading && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6 flex items-center justify-between animate-fade-in-up">
                <div className="flex items-center text-orange-800">
                    <CalendarClock className="mr-3" size={24} />
                    <div>
                        <h3 className="font-bold">Yeni Hafta, Yeni Liste!</h3>
                        <p className="text-sm">Bu diyet listesi 7 günü doldurdu. Vücudunu şaşırtmak için listeyi güncelleme zamanı.</p>
                    </div>
                </div>
                <button 
                    onClick={handleNewPlan}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition shadow-sm whitespace-nowrap ml-4"
                >
                    Listeyi Yenile
                </button>
            </div>
        )}
        
        {!plan && !loading && (
             <div className="animate-fade-in-up">
                {userProfile ? (
                     <div className="text-center py-10">
                         <h2 className="text-2xl font-bold text-gray-800 mb-4">Profiliniz Hazır</h2>
                         <p className="text-gray-600 mb-6">Kayıtlı profil bilgilerinize göre planınızı oluşturmak için aşağıdaki butona tıklayın.</p>
                         <button 
                            onClick={() => handleProfileSubmit(userProfile)}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow hover:bg-emerald-700 transition"
                         >
                            Planımı Oluştur
                         </button>
                         <button 
                            onClick={handleReset}
                            className="block mx-auto mt-4 text-sm text-gray-400 hover:text-red-500"
                         >
                             Profili Sil ve Baştan Başla
                         </button>
                     </div>
                ) : (
                    <ProfileForm onSubmit={handleProfileSubmit} isLoading={loading} />
                )}
             </div>
        )}

        {loading && (
            <div className="mt-12 text-center space-y-4">
                <p className="text-gray-500 animate-pulse">Yapay zeka metabolizmanı analiz ediyor, kalori hesaplıyor ve haftalık planını hazırlıyor...</p>
                <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-progress"></div>
                </div>
            </div>
        )}

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-2xl mx-auto mt-4" role="alert">
                <strong className="font-bold">Hata!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        )}

        {plan && userProfile && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Sidebar: Tracker */}
                <div className="md:col-span-1 space-y-6">
                    <WeightTracker 
                        userProfile={userProfile} 
                        userEmail={currentUser.email}
                        onUpdateCurrentWeight={handleUpdateCurrentWeight} 
                    />
                     <button 
                        onClick={handleReset}
                        className="w-full mt-4 text-xs text-gray-400 hover:text-red-500 border border-transparent hover:border-red-100 p-2 rounded transition"
                    >
                        Planı ve Verileri Sıfırla
                    </button>
                </div>

                {/* Right/Main Content: Diet Plan */}
                <div className="md:col-span-2">
                    <PlanDisplay plan={plan} userProfile={userProfile} />
                </div>
            </div>
        )}

      </main>

      <style>{`
        @keyframes progress {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 50%; }
          100% { width: 100%; transform: translateX(0); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.5s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        /* Custom scrollbar for history list */
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1; 
            border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default App;