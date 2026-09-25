import { useState, useRef, useEffect, useCallback } from 'react';
import { Profile, Message } from './types';
import { profiles } from './data/profiles';
import { generateBotResponse, getTypingDelay } from './utils/botEngine';

type View = 'discover' | 'matches' | 'chat' | 'chat-list';

function App() {
  const [currentView, setCurrentView] = useState<View>('discover');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [chats, setChats] = useState<Record<number, Message[]>>({});
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [likes, setLikes] = useState<number[]>([]);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [viewedProfiles, setViewedProfiles] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chats, isTyping, scrollToBottom]);

  const showNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setCurrentView('chat');
    if (!chats[profile.id]) {
      setChats(prev => ({ ...prev, [profile.id]: [] }));
    }
    if (!viewedProfiles.includes(profile.id)) {
      setViewedProfiles(prev => [...prev, profile.id]);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedProfile) return;

    const userMessage: Message = {
      id: Date.now(),
      senderId: 'user',
      text: inputMessage.trim(),
      timestamp: new Date(),
      read: true
    };

    setChats(prev => ({
      ...prev,
      [selectedProfile.id]: [...(prev[selectedProfile.id] || []), userMessage]
    }));

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    const delay = getTypingDelay(messageText);
    setTimeout(() => {
      const botResponse = generateBotResponse(messageText, selectedProfile);
      const botMessage: Message = {
        id: Date.now() + 1,
        senderId: selectedProfile.id,
        text: botResponse,
        timestamp: new Date(),
        read: true
      };

      setChats(prev => ({
        ...prev,
        [selectedProfile.id]: [...(prev[selectedProfile.id] || []), botMessage]
      }));
      setIsTyping(false);
    }, delay);
  };

  const handleLike = (profileId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!likes.includes(profileId)) {
      setLikes(prev => [...prev, profileId]);
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
      
      if (Math.random() > 0.5) {
        const profile = profiles.find(p => p.id === profileId);
        setTimeout(() => {
          showNotification(`💕 Взаимная симпатия! ${profile?.name} тоже лайкнула вас!`);
        }, 1500);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getLastMessage = (profileId: number) => {
    const chatMessages = chats[profileId] || [];
    if (chatMessages.length === 0) return null;
    return chatMessages[chatMessages.length - 1];
  };

  const activeChats = profiles.filter(p => chats[p.id] && chats[p.id].length > 0);

  // Profile Avatar Component
  const ProfileAvatar = ({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-14 h-14 text-2xl',
      lg: 'w-24 h-24 text-4xl',
      xl: 'w-32 h-32 text-5xl'
    };
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 flex-shrink-0`}>
        <img 
          src={profile.photo} 
          alt={profile.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="flex items-center justify-center w-full h-full text-2xl">${profile.avatar}</span>`;
          }}
        />
      </div>
    );
  };

  // Notification Toast
  const renderNotification = () => (
    notification && (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium whitespace-nowrap">
          {notification}
        </div>
      </div>
    )
  );

  // Discover Page
  const renderDiscover = () => (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💕</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              LoveMatch
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('matches')}
              className="relative p-2 hover:bg-pink-50 rounded-full transition-colors"
            >
              <span className="text-lg">💌</span>
              {likes.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {likes.length}
                </span>
              )}
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              Г
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="text-center mb-5">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
            Найди свою половинку ✨
          </h2>
          <p className="text-gray-500 text-sm">
            {profiles.filter(p => p.online).length} человек онлайн
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {['Все', 'Онлайн', 'Новые', 'Рядом'].map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                i === 0
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 group"
              onClick={() => handleSelectProfile(profile)}
            >
              {/* Photo */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <img 
                  src={profile.photo} 
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                {profile.online && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    Online
                  </span>
                )}
                {likes.includes(profile.id) && (
                  <span className="absolute top-2 left-2 text-lg drop-shadow-lg">❤️</span>
                )}
                {!viewedProfiles.includes(profile.id) && (
                  <span className="absolute bottom-12 left-2 bg-white/90 backdrop-blur-sm text-purple-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    ✨ Новый
                  </span>
                )}

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-bold text-base drop-shadow-md">
                    {profile.name}, {profile.age}
                  </h3>
                  <p className="text-white/80 text-xs drop-shadow">📍 {profile.city}</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{profile.bio}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {profile.interests.slice(0, 2).map(interest => (
                    <span
                      key={interest}
                      className="text-[10px] bg-gradient-to-r from-pink-50 to-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => handleSelectProfile(profile)}
                    className="text-xs text-purple-500 font-medium hover:text-purple-700"
                  >
                    Написать 💬
                  </button>
                  <button
                    onClick={(e) => handleLike(profile.id, e)}
                    className={`text-lg transition-all hover:scale-125 ${
                      likes.includes(profile.id) ? 'animate-heartbeat' : ''
                    }`}
                  >
                    {likes.includes(profile.id) ? '❤️' : '🤍'}
                  </button>
                </div>

                {getLastMessage(profile.id) && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 truncate">
                      💬 {getLastMessage(profile.id)?.text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-0.5 px-4 py-1 text-pink-500">
            <span className="text-xl">🔍</span>
            <span className="text-[10px] font-medium">Поиск</span>
          </button>
          <button
            onClick={() => setCurrentView('matches')}
            className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400 hover:text-pink-500 transition-colors"
          >
            <span className="text-xl relative">
              💌
              {likes.length > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-pink-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {likes.length}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">Симпатии</span>
          </button>
          <button
            onClick={() => setCurrentView('chat-list')}
            className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400 hover:text-pink-500 transition-colors"
          >
            <span className="text-xl relative">
              💬
              {activeChats.length > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeChats.length}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">Чаты</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400 hover:text-pink-500 transition-colors">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-medium">Профиль</span>
          </button>
        </div>
      </nav>
    </div>
  );

  // Matches Page
  const renderMatches = () => (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-20">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setCurrentView('discover')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-800">💕 Симпатии</h2>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-5">
        {likes.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">💝</span>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Пока нет симпатий</h3>
            <p className="text-gray-500 mb-6 text-sm">Лайкайте профили, чтобы находить взаимные симпатии!</p>
            <button
              onClick={() => setCurrentView('discover')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              Найти кого-нибудь 🔍
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {profiles.filter(p => likes.includes(p.id)).map(profile => (
              <div
                key={profile.id}
                onClick={() => handleSelectProfile(profile)}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer group"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img 
                    src={profile.photo} 
                    alt={profile.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h4 className="text-white font-bold">{profile.name}, {profile.age}</h4>
                    <p className="text-white/80 text-xs">📍 {profile.city}</p>
                  </div>
                </div>
                <div className="p-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectProfile(profile);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs rounded-full font-medium hover:shadow transition-all"
                  >
                    Написать 💬
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-around py-2">
          <button onClick={() => setCurrentView('discover')} className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
            <span className="text-xl">🔍</span>
            <span className="text-[10px] font-medium">Поиск</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1 text-pink-500">
            <span className="text-xl">💌</span>
            <span className="text-[10px] font-medium">Симпатии</span>
          </button>
          <button onClick={() => setCurrentView('chat-list')} className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
            <span className="text-xl">💬</span>
            <span className="text-[10px] font-medium">Чаты</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-medium">Профиль</span>
          </button>
        </div>
      </nav>
    </div>
  );

  // Chat List Page
  const renderChatList = () => (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-20">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setCurrentView('discover')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-800">💬 Чаты</h2>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {activeChats.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">💬</span>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Нет активных чатов</h3>
            <p className="text-gray-500 mb-6 text-sm">Начните общение, выбрав понравившийся профиль!</p>
            <button
              onClick={() => setCurrentView('discover')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              Найти кого-нибудь 🔍
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeChats.map(profile => {
              const lastMsg = getLastMessage(profile.id);
              return (
                <div
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="relative">
                    <ProfileAvatar profile={profile} size="md" />
                    {profile.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-gray-800 text-sm">{profile.name}, {profile.age}</h4>
                      {lastMsg && (
                        <span className="text-[10px] text-gray-400">
                          {lastMsg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-gray-500 truncate">
                        {lastMsg.senderId === 'user' ? 'Вы: ' : ''}{lastMsg.text}
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-around py-2">
          <button onClick={() => setCurrentView('discover')} className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
            <span className="text-xl">🔍</span>
            <span className="text-[10px] font-medium">Поиск</span>
          </button>
          <button onClick={() => setCurrentView('matches')} className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
            <span className="text-xl">💌</span>
            <span className="text-[10px] font-medium">Симпатии</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1 text-pink-500">
            <span className="text-xl">💬</span>
            <span className="text-[10px] font-medium">Чаты</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-medium">Профиль</span>
          </button>
        </div>
      </nav>
    </div>
  );

  // Chat View
  const renderChat = () => {
    if (!selectedProfile) return null;
    const messages = chats[selectedProfile.id] || [];

    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        {/* Chat Header */}
        <header className="bg-white/90 backdrop-blur-md shadow-sm flex-shrink-0">
          <div className="max-w-4xl mx-auto px-3 py-2.5 flex items-center gap-3">
            <button
              onClick={() => setCurrentView('chat-list')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="relative">
              <ProfileAvatar profile={selectedProfile} size="sm" />
              {selectedProfile.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-sm">{selectedProfile.name}, {selectedProfile.age}</h3>
              <p className="text-[11px] text-gray-500">
                {selectedProfile.online ? (
                  <span className="text-green-500">● В сети</span>
                ) : (
                  `⚫ ${selectedProfile.lastSeen || 'Была недавно'}`
                )}
              </p>
            </div>
            <button
              onClick={(e) => handleLike(selectedProfile.id, e)}
              className={`p-2 rounded-full transition-all ${
                likes.includes(selectedProfile.id) ? 'bg-pink-100' : 'hover:bg-gray-100'
              }`}
            >
              <span className={`text-lg ${likes.includes(selectedProfile.id) ? 'animate-heartbeat' : ''}`}>
                {likes.includes(selectedProfile.id) ? '❤️' : '🤍'}
              </span>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-8 animate-fade-in">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 shadow-lg">
                  <img 
                    src={selectedProfile.photo} 
                    alt={selectedProfile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                  Начни общение с {selectedProfile.name}!
                </h3>
                <p className="text-gray-500 text-sm mb-4">Напиши первое сообщение 😊</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Привет! 👋', 'Как дела?', 'Чем занимаешься?'].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setInputMessage(suggestion)}
                      className="px-3 py-1.5 bg-white rounded-full text-xs text-purple-600 border border-purple-200 hover:bg-purple-50 transition-colors shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-3 animate-fade-in ${
                  message.senderId === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.senderId !== 'user' && (
                  <div className="mr-2 mt-1 flex-shrink-0">
                    <ProfileAvatar profile={selectedProfile} size="sm" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                    message.senderId === 'user'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-md'
                      : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-[10px] mt-0.5 ${
                    message.senderId === 'user' ? 'text-pink-200' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    {message.senderId === 'user' && ' ✓✓'}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start mb-3 animate-fade-in">
                <div className="mr-2 mt-1 flex-shrink-0">
                  <ProfileAvatar profile={selectedProfile} size="sm" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 px-3 py-2.5 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-lg flex-shrink-0">😊</button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Напиши сообщение..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      {renderNotification()}
      
      {showLikeAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="relative">
            <span className="text-7xl animate-ping absolute inset-0 flex items-center justify-center">❤️</span>
            <span className="text-7xl">❤️</span>
          </div>
        </div>
      )}

      {currentView === 'discover' && renderDiscover()}
      {currentView === 'matches' && renderMatches()}
      {currentView === 'chat-list' && renderChatList()}
      {currentView === 'chat' && renderChat()}
    </div>
  );
}

export default App;
