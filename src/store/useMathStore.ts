import { create } from 'zustand'
import { GradeLevel, MathQuestion, MathOpType } from '@/types'

interface MathState {
  currentGrade: GradeLevel
  setCurrentGrade: (grade: GradeLevel) => void

  // 题目列表
  questions: MathQuestion[]
  setQuestions: (questions: MathQuestion[]) => void

  // 当前题目索引
  currentIndex: number
  setCurrentIndex: (index: number) => void

  // 用户答案
  answers: (number | null)[]
  setAnswer: (index: number, answer: number) => void

  // 得分
  scores: number[]
  setScore: (index: number, score: number) => void

  // 题目数量
  questionCount: number
  setQuestionCount: (count: number) => void

  // 运算类型筛选
  opFilter: MathOpType[]
  setOpFilter: (ops: MathOpType[]) => void

  // 难度
  difficulty: number
  setDifficulty: (d: number) => void
}

export const useMathStore = create<MathState>((set) => ({
  currentGrade: 1,
  setCurrentGrade: (grade) => set({ currentGrade: grade }),

  questions: [],
  setQuestions: (questions) => set({ questions }),

  currentIndex: 0,
  setCurrentIndex: (index) => set({ currentIndex: index }),

  answers: [],
  setAnswer: (index, answer) =>
    set((state) => {
      const answers = [...state.answers]
      answers[index] = answer
      return { answers }
    }),

  scores: [],
  setScore: (index, score) =>
    set((state) => {
      const scores = [...state.scores]
      scores[index] = score
      return { scores }
    }),

  questionCount: 10,
  setQuestionCount: (count) => set({ questionCount: count }),

  opFilter: ['+', '-'],
  setOpFilter: (ops) => set({ opFilter: ops }),

  difficulty: 1,
  setDifficulty: (d) => set({ difficulty: d }),
}))
