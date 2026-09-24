export interface Profile {
  id: number;
  name: string;
  age: number;
  city: string;
  bio: string;
  interests: string[];
  avatar: string;
  photo: string;
  online: boolean;
  lastSeen?: string;
  personality: 'romantic' | 'playful' | 'intellectual' | 'adventurous' | 'caring';
}

export interface Message {
  id: number;
  senderId: 'user' | number;
  text: string;
  timestamp: Date;
  read: boolean;
}

export interface Chat {
  profileId: number;
  messages: Message[];
}
