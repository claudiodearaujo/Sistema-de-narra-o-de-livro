import React from 'react';
import { useAuthorStats } from '../../../shared/hooks/useAuthorStats';
import { Loader2, TrendingUp, Users, BookOpen, Mic, DollarSign, Heart, MessageCircle } from 'lucide-react';

export function DashboardPage() {
  const { data, isLoading } = useAuthorStats();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
      </div>
    );
  }

  const stats = data?.overview;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard do Autor</h1>
        <p className="text-gray-500 mt-2">Acompanhe métricas e evolução das suas obras.</p>
      </header>

      {/* Visão Geral - Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatsCard 
          title="Livros Publicados" 
          value={stats?.works?.books} 
          icon={<BookOpen className="w-6 h-6" />} 
          color="bg-indigo-50 text-indigo-600"
        />
        <StatsCard 
          title="Capítulos Criados" 
          value={stats?.works?.chapters} 
          icon={<BookOpen className="w-6 h-6" />} 
          color="bg-blue-50 text-blue-600"
        />
        <StatsCard 
          title="Falas Editadas" 
          value={stats?.works?.speeches} 
          icon={<Mic className="w-6 h-6" />} 
          color="bg-purple-50 text-purple-600"
        />
        <StatsCard 
          title="Seguidores" 
          value={stats?.audience?.followers} 
          icon={<Users className="w-6 h-6" />} 
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Detalhes - Engajamento e Ganhos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Engajamento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-lg text-gray-800">Engajamento de Leitores</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <Heart className="w-8 h-8 text-pink-500 mb-2" />
                <span className="text-2xl font-bold text-gray-800">{stats?.engagement?.likes || 0}</span>
                <span className="text-sm text-gray-500">Likes Totais</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <MessageCircle className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-2xl font-bold text-gray-800">{stats?.engagement?.comments || 0}</span>
                <span className="text-sm text-gray-500">Comentários</span>
            </div>
          </div>
        </div>

        {/* Ganhos - Livras */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-lg text-gray-800">Seu Balanço de Earn</h3>
          </div>

          <div className="flex items-center justify-between bg-amber-50 p-6 rounded-lg border border-amber-100 mb-4">
             <div>
                <span className="text-sm text-amber-800 font-medium uppercase tracking-wide">Saldo Atual</span>
                <div className="text-4xl font-bold text-amber-600 mt-1">{stats?.earnings?.current || 0} L</div>
             </div>
             <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold text-xl">
                 L
             </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-500 px-2">
             <span>Total Acumulado (Lifetime):</span>
             <span className="font-medium">{stats?.earnings?.lifetime || 0} L</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
            <div className={`p-4 rounded-full ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
            </div>
        </div>
    );
}
