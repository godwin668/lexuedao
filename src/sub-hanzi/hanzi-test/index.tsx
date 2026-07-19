import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useHanziStore } from '@/store/useHanziStore';
import { savePracticeRecord, updateRank } from '@/services/api';
import { getStrokeData } from '@/data/strokeData';
import { drawGrid } from '@/utils/canvasStrokeRenderer';
import { evaluateCharacterScore } from '@/utils/strokeScoring';
import { useCanvasCore } from '@/hooks/useCanvasCore';
import styles from './index.module.scss';

const TestPage: React.FC = () => {
  const { selectedCharacters } = useHanziStore();
  const [charIndex, setCharIndex] = useState(0);
  const [completedChars, setCompletedChars] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<any>(null);

  const currentChar = selectedCharacters[charIndex];

  const {
    userStrokes,
    userStrokesRef,
    setUserStrokes,
    initCanvas,
    clearCanvas,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useCanvasCore({
    canvasId: '#testCanvas',
    disabled: false,
    strokeColor: '#333333',
  });

  useEffect(() => {
    if (selectedCharacters.length === 0) {
      Taro.showToast({ title: '请先选择汉字', icon: 'none' });
      Taro.navigateBack();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!currentChar) return;
    setUserStrokes([]);
    initCanvas((ctx, w, h) => {
      drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 10, gridSize: 1024 });
    });
  }, [charIndex]);

  const handleClear = () => {
    clearCanvas((ctx, w, h) => {
      drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 10, gridSize: 1024 });
    });
  };

  const handleNextChar = () => {
    const currentStrokes = userStrokesRef.current;
    const sd = getStrokeData(currentChar?.char || '');
    const { score } = evaluateCharacterScore(currentStrokes, sd?.medians);

    const newScores = [...scores];
    newScores[charIndex] = score;
    setScores(newScores);
    setCompletedChars([...completedChars, charIndex]);

    if (charIndex < selectedCharacters.length - 1) {
      setCharIndex(charIndex + 1);
    }
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);

    const currentStrokes = userStrokesRef.current;
    const sd = getStrokeData(currentChar?.char || '');
    const { score: lastScore } = evaluateCharacterScore(currentStrokes, sd?.medians);

    const finalScores = [...scores];
    finalScores[charIndex] = lastScore;
    const avgAccuracy = finalScores.reduce((a, b) => a + b, 0) / finalScores.length;

    const sessionData = {
      char: currentChar?.char || '',
      userStrokes: [...currentStrokes],
    };
    useHanziStore.getState().setLastSessionData(sessionData);
    Taro.setStorageSync('hanzi_last_session', JSON.stringify(sessionData));

    Taro.redirectTo({
      url: `/sub-hanzi/hanzi-result/index?score=${Math.round(avgAccuracy)}&accuracy=${Math.round(avgAccuracy)}&aesthetics=${Math.round(avgAccuracy)}&char=${selectedCharacters.map(c => c.char).join('')}&isTest=1`,
    });

    savePracticeRecord({
      subject: 'hanzi',
      type: 'test',
      grade: useHanziStore.getState().currentGrade,
      contentJson: {
        characters: selectedCharacters.map((c) => c.char),
        scores: finalScores,
        avgAccuracy: Math.round(avgAccuracy),
        totalTime: timer,
      },
      score: Math.round(avgAccuracy),
      accuracy: Math.round(avgAccuracy),
      duration: timer,
    }).catch((err) => {
      console.error('[TestPage] savePracticeRecord error:', err);
    });
    updateRank({ subject: 'hanzi', score: Math.round(avgAccuracy) }).catch(() => {});
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  if (!currentChar) return null;

  return (
    <View className={styles.page}>
      <View className={styles.topBar}>
        <View className={styles.charInfo}>
          <View className={styles.charDisplay}>
            <Text>{currentChar.char}</Text>
          </View>
          <View>
            <Text className={styles.charText}>请写：{currentChar.char}</Text>
            <Text className={styles.progress}>
              {charIndex + 1} / {selectedCharacters.length}
            </Text>
          </View>
        </View>
        <Text className={styles.timer}>{formatTime(timer)}</Text>
      </View>

      <View className={styles.charList}>
        {selectedCharacters.map((c, i) => (
          <View
            key={i}
            className={classnames(
              styles.charTag,
              i === charIndex && styles.active,
              completedChars.includes(i) && styles.done
            )}
          >
            <Text>{c.char}</Text>
          </View>
        ))}
      </View>

      <View className={styles.canvasWrapper}>
        <Canvas
          id="testCanvas"
          type="2d"
          className={styles.canvas}
          disableScroll
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={`${styles.actionBtn} ${styles.clearBtn}`} onClick={handleClear}>
          <Text>清除</Text>
        </View>
        {charIndex < selectedCharacters.length - 1 ? (
          <View className={`${styles.actionBtn} ${styles.submitBtn}`} onClick={handleNextChar}>
            <Text>下一个字</Text>
          </View>
        ) : (
          <View className={`${styles.actionBtn} ${styles.submitBtn}`} onClick={handleSubmit}>
            <Text>提交测试</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TestPage;
