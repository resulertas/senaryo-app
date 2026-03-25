export type ElementType = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'paragraph';

export type ScreenplayFormat = 'US' | 'FR';

export interface CoverPageData {
  title: string;
  author: string;
  version: string;
  date: string;
}

export interface ScreenplayElement {
  id: string;
  type: ElementType;
  content: string;
  sceneNumber?: number;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
}

export interface Screenplay {
  id: string;
  title: string;
  elements: ScreenplayElement[];
  format: ScreenplayFormat;
  coverPage?: CoverPageData;
  updatedAt?: number;
}
