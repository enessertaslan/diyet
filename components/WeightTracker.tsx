import React, { useState, useEffect } from 'react';
import { UserProfile, WeightEntry, Goal } from '../types';
import { Scale, TrendingDown, TrendingUp, Trophy, Plus, Clock } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  userEmail: string; // Used for unique storage key
  onUpdateCurrentWeight: (weight: number) => void;
}

const WeightTracker: React.FC<Props> = ({ userProfile, userEmail, onUpdateCurrentWeight }) => {
  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState<number | string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const storageKey = `diet_app_weight_history_${userEmail}`;

  // Initialize history from localStorage or create initial entry
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setHistory(JSON.parse(saved));
    } else {
      const initialEntry: WeightEntry = {
        date: new Date().toISOString(),
        weight: userProfile.weight
      };
      setHistory([initialEntry]);
      localStorage.setItem(storageKey, JSON.stringify([initialEntry]));
    }
  }, [storageKey, userProfile.weight]);

  // Check for weekly reminder
  useEffect(() => {
    if (history.length > 0) {
      const lastEntry = new Date(history[history.length - 1].date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastEntry.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 7) {
        setMessage({
          text: `Son tartılmanın üzerinden ${diffDays} gün geçti. Güncel kilonuzu girmeyi unutmayın!`,
          type: 'warning'
        });
      }
    }
  }, [history]);

  const handleAddWeight = () => {
    if (!newWeight || isNaN(Number(newWeight))) return;

    const weightVal = Number(newWeight);
    const newEntry: WeightEntry = {
      date: new Date().toISOString(),
      weight: weightVal
    };

    const updatedHistory = [...history, newEntry];
    setHistory(updatedHistory);
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
    
    // Update global state if needed
    onUpdateCurrentWeight(weightVal);
    
    // Check Goal
    const isLosing = userProfile.goal === Goal.LOSE_WEIGHT;
    const reachedGoal = isLosing 
        ? weightVal <= userProfile.targetWeight 
        : weightVal >= userProfile.targetWeight;

    if (reachedGoal) {
        setMessage({
            text: "🎉 Tebrikler! Hedef kilonuza ulaştınız! Harika bir iş çıkardınız.",
            type: 'success'
        });
    } else {
        const diff = Math.abs(weightVal - userProfile.targetWeight).toFixed(1);
        setMessage({
            text: `Hedefinize ${diff} kg kaldı. Devam edin!`,
            type: 'info'
        });
    }

    setNewWeight('');
  };

  const currentWeight = history.length > 0 ? history[history.length - 1].weight : userProfile.weight;
  const startWeight = history.length > 0 ? history[0].weight : userProfile.weight;
  
  // Progress Calculation
  const totalChangeNeeded = Math.abs(startWeight - userProfile.targetWeight);
  const currentChange = Math.abs(startWeight - currentWeight);
  const progressPercent = totalChangeNeeded === 0 ? 100 : Math.min(100, Math.max(0, (currentChange / totalChangeNeeded) * 100));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Scale className="mr-2 text-blue-600" /> Kilo Takibi
        </h2>
        <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
                <span className="block text-gray-400 text-xs">Başlangıç</span>
                <span className="font-semibold text-gray-700">{startWeight} kg</span>
            </div>
            <div className="text-center">
                <span className="block text-gray-400 text-xs">Hedef</span>
                <span className="font-semibold text-emerald-600">{userProfile.targetWeight} kg</span>
            </div>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-start ${
              message.type === 'success' ? 'bg-green-100 text-green-800' :
              message.type === 'warning' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-50 text-blue-800'
          }`}>
              {message.type === 'success' ? <Trophy className="mr-2 flex-shrink-0" /> : <Clock className="mr-2 flex-shrink-0" />}
              <span className="font-medium">{message.text}</span>
          </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2 text-gray-600 font-medium">
            <span>Şu an: <span className="text-gray-900 text-lg font-bold">{currentWeight} kg</span></span>
            <span>%{Math.round(progressPercent)} Tamamlandı</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
            <div 
                className="bg-gradient-to-r from-blue-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
            ></div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex gap-2 items-end mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex-1">
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 block">Yeni Kilo Girişi</label>
            <input 
                type="number" 
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="Örn: 75.5"
                className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
        </div>
        <button 
            onClick={handleAddWeight}
            disabled={!newWeight}
            className="bg-gray-900 text-white p-2.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
            <Plus size={20} /> <span className="ml-2 hidden sm:inline">Kaydet</span>
        </button>
      </div>

      {/* History List */}
      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Geçmiş Kayıtlar</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {[...history].reverse().map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded transition">
                    <span className="text-gray-500">
                        {new Date(entry.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                    </span>
                    <span className="font-medium text-gray-800 flex items-center">
                        {entry.weight} kg
                        {idx < history.length - 1 && (
                            // Determine trend compared to next item (which is older in reversed array)
                            entry.weight < history[history.length - 1 - (idx + 1)].weight ? 
                            <TrendingDown size={14} className="ml-2 text-green-500" /> : 
                            entry.weight > history[history.length - 1 - (idx + 1)].weight ? 
                            <TrendingUp size={14} className="ml-2 text-red-500" /> : 
                            <span className="ml-2 text-gray-300">-</span>
                        )}
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default WeightTracker;