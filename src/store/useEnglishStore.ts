import { create } from 'zustand'
import { GradeLevel, EnglishWord } from '@/types'

interface EnglishState {
  currentGrade: GradeLevel
  setCurrentGrade: (grade: GradeLevel) => void

  // 当前学习单词列表
  words: EnglishWord[]
  setWords: (words: EnglishWord[]) => void

  // 当前单词索引
  currentIndex: number
  setCurrentIndex: (index: number) => void

  // 学习模式: flashcard | spell | listen | test
  mode: 'flashcard' | 'spell' | 'listen' | 'test'
  setMode: (mode: EnglishState['mode']) => void

  // 拼写答案
  spellAnswers: string[]
  setSpellAnswer: (index: number, answer: string) => void

  // 听力答案
  listenAnswers: (number | null)[]
  setListenAnswer: (index: number, answer: number) => void

  // 得分
  scores: number[]
  setScore: (index: number, score: number) => void

  // 单词数量
  wordCount: number
  setWordCount: (count: number) => void
}

export const useEnglishStore = create<EnglishState>((set) => ({
  currentGrade: 1,
  setCurrentGrade: (grade) => set({ currentGrade: grade }),

  words: [],
  setWords: (words) => set({ words }),

  currentIndex: 0,
  setCurrentIndex: (index) => set({ currentIndex: index }),

  mode: 'flashcard',
  setMode: (mode) => set({ mode }),

  spellAnswers: [],
  setSpellAnswer: (index, answer) =>
    set((state) => {
      const spellAnswers = [...state.spellAnswers]
      spellAnswers[index] = answer
      return { spellAnswers }
    }),

  listenAnswers: [],
  setListenAnswer: (index, answer) =>
    set((state) => {
      const listenAnswers = [...state.listenAnswers]
      listenAnswers[index] = answer
      return { listenAnswers }
    }),

  scores: [],
  setScore: (index, score) =>
    set((state) => {
      const scores = [...state.scores]
      scores[index] = score
      return { scores }
    }),

  wordCount: 10,
  setWordCount: (count) => set({ wordCount: count }),
}))
