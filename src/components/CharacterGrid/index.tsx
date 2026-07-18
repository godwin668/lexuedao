import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { CharacterInfo } from '@/types'
import styles from './index.module.scss'

interface CharacterGridProps {
  characters: CharacterInfo[]
  selectedChars: string[]
  onToggle: (char: CharacterInfo) => void
}

const CharacterGrid: React.FC<CharacterGridProps> = ({ characters, selectedChars, onToggle }) => {
  return (
    <View className={styles.grid}>
      {characters.map((char) => {
        const isSelected = selectedChars.includes(char.char)
        return (
          <View
            key={char.char}
            className={classnames(styles.gridItem, isSelected && styles.selected)}
            onClick={() => onToggle(char)}
          >
            <Text className={styles.charText}>{char.char}</Text>
            <Text className={styles.pinyin}>{char.pinyin}</Text>
          </View>
        )
      })}
    </View>
  )
}

export default CharacterGrid
