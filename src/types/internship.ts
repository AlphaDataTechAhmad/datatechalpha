export interface Internship {
  $id: string;
  id: string;
  title: string;
  slug: string;
  description: string;
  duration: string;
  level: string;
  image: string;
  price?: number;
  currency?: string;
  projects?: Project[];
  videos?: Video[];
  liveSessions?: LiveSession[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  sourceCodeUrl?: string;
  resources?: Resource[];
}

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: string;
  thumbnail?: string;
}

export interface LiveSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  jitsiRoom: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'document' | 'code' | 'link' | 'other';
  url: string;
}
