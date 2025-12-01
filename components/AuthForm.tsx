import React, { useState } from 'react';
import { User } from '../types';
import { Leaf, Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const AuthForm: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate Backend Logic with LocalStorage
    const usersStr = localStorage.getItem('diet_app_users');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    if (isLogin) {
      // Login Logic
      const foundUser = users.find(u => u.email === formData.email && u.password === formData.password);
      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('E-posta veya şifre hatalı.');
      }
    } else {
      // Register Logic
      if (users.find(u => u.email === formData.email)) {
        setError('Bu e-posta adresi zaten kayıtlı.');
        return;
      }
      
      const newUser: User = {
        name: formData.name,
        email: formData.email,
        password: formData.password
      };
      
      users.push(newUser);
      localStorage.setItem('diet_app_users', JSON.stringify(users));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md animate-fade-in-up">
        
        <div className="text-center mb-8">
          <div className="bg-emerald-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Leaf className="text-emerald-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Tekrar Hoşgeldiniz' : 'Hesap Oluştur'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isLogin 
              ? 'Sağlıklı yaşam yolculuğunuza devam edin.' 
              : 'Kişiselleştirilmiş diyet planınız için hemen katılın.'}
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              !isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">İsim Soyisim</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  placeholder="Adınız"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full pl-10 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">E-Posta</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="ornek@mail.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">Şifre</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="******"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transform transition hover:-translate-y-0.5 flex items-center justify-center"
          >
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol ve Başla'} <ArrowRight size={18} className="ml-2" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;