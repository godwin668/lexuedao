import { create } from 'zustand'
import { GradeLevel, CharacterInfo, StrokeCharData } from '@/types'

interface HanziState {
  // 年级
  currentGrade: GradeLevel
  setCurrentGrade: (grade: GradeLevel) => void

  // 选字
  selectedCharacters: CharacterInfo[]
  setSelectedCharacters: (chars: CharacterInfo[]) => void
  addSelectedCharacter: (char: CharacterInfo) => void
  removeSelectedCharacter: (char: string) => void

  // 当前书写索引
  currentCharIndex: number
  setCurrentCharIndex: (index: number) => void
  nextChar: () => void
  prevChar: () => void

  // 自定义字数
  customCount: number
  setCustomCount: (count: number) => void

  // 最近一次书写的笔迹数据
  lastSessionData: { char: string; userStrokes: string[][] } | null
  setLastSessionData: (data: { char: string; userStrokes: string[][] } | null) => void

  // 从历史记录进入结果页的数据
  historyResultData: {
    char: string
    score: number
    accuracy: number
    aesthetics?: number
    isTest?: boolean
  } | null
  setHistoryResultData: (data: HanziState['historyResultData']) => void

  // 笔画数据缓存
  strokeDataCache: Record<string, StrokeCharData>
  setStrokeData: (char: string, data: StrokeCharData) => void
}

export const useHanziStore = create<HanziState>((set, get) => ({
  currentGrade: 1,
  setCurrentGrade: (grade) => set({ currentGrade: grade }),

  selectedCharacters: [],
  setSelectedCharacters: (chars) => set({ selectedCharacters: chars }),
  addSelectedCharacter: (char) =>
    set((state) => ({
      selectedCharacters: [...state.selectedCharacters, char],
    })),
  removeSelectedCharacter: (char) =>
    set((state) => ({
      selectedCharacters: state.selectedCharacters.filter((c) => c.char !== char),
    })),

  currentCharIndex: 0,
  setCurrentCharIndex: (index) => set({ currentCharIndex: index }),
  nextChar: () => {
    const { currentCharIndex, selectedCharacters } = get()
    if (currentCharIndex < selectedCharacters.length - 1) {
      set({ currentCharIndex: currentCharIndex + 1 })
    }
  },
  prevChar: () => {
    const { currentCharIndex } = get()
    if (currentCharIndex > 0) {
      set({ currentCharIndex: currentCharIndex - 1 })
    }
  },

  customCount: 5,
  setCustomCount: (count) => set({ customCount: count }),

  lastSessionData: null,
  setLastSessionData: (data) => set({ lastSessionData: data }),

  historyResultData: null,
  setHistoryResultData: (data) => set({ historyResultData: data }),

  strokeDataCache: {},
  setStrokeData: (char, data) =>
    set((state) => ({
      strokeDataCache: { ...state.strokeDataCache, [char]: data },
    })),
}))
