import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useHanziStore } from '@/store/useHanziStore';
import { getStrokeData } from '@/data/strokeData';
import { drawGrid, drawAllStrokeOutlines } from '@/utils/canvasStrokeRenderer';
import styles from './index.module.scss';

const ResultPage: React.FC = () => {
  const router = useRouter();
  const {
    score = '0', accuracy = '0', aesthetics = '0',
    char = '', isTest = '0', fromHistory = '0',
  } = router.params;
  const lastSessionData = useHanziStore(s => s.lastSessionData);

  const scoreNum = parseInt(score as string, 10) || 0;
  const accuracyNum = parseInt(accuracy as string, 10) || 0;
  const aestheticsNum = parseInt(aesthetics as string, 10) || 0;
  const isFromHistory = fromHistory === '1';

  const [userCanvasReady, setUserCanvasReady] = React.useState(false);
  const [stdCanvasReady, setStdCanvasReady] = React.useState(false);
  const userStrokesRef = useRef(lastSessionData?.userStrokes);

  // 从 store 或 storage 获取笔画数据（子包页面间 store 可能不共享，用 storage 兜底）
  const getSessionData = () => {
    if (lastSessionData?.userStrokes?.length) return lastSessionData;
    try {
      const raw = Taro.getStorageSync('hanzi_last_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.userStrokes?.length) return parsed;
      }
    } catch {}
    return null;
  };
  const sessionData = getSessionData();

  // 保存最新的笔画数据到 ref，避免闭包过期
  useEffect(() => {
    userStrokesRef.current = lastSessionData?.userStrokes;
  }, [lastSessionData]);

  const getScoreLevel = (s: number) => {
    if (s >= 90) return { level: 'excellent', text: '太棒了！', emoji: '🌟' };
    if (s >= 75) return { level: 'good', text: '做得不错！', emoji: '👍' };
    if (s >= 60) return { level: 'fair', text: '继续加油！', emoji: '💪' };
    return { level: 'poor', text: '再练练吧！', emoji: '📖' };
  };

  const scoreInfo = getScoreLevel(scoreNum);

  const improvementTips = useMemo(() => {
    const tips: string[] = [];
    if (accuracyNum < 70) tips.push('注意笔画的起笔和收笔位置，多看示范动画');
    if (aestheticsNum < 70) tips.push('控制好字形结构，横平竖直，注意各部分比例');
    if (accuracyNum >= 70 && accuracyNum < 85) tips.push('笔画基本正确，再注意一下笔顺和连笔');
    if (aestheticsNum >= 70 && aestheticsNum < 85) tips.push('结构大致合理，可以多注意笔画间距均匀');
    return tips;
  }, [accuracyNum, aestheticsNum]);

  // 直接初始化 Canvas 并绘制，不依赖 useCanvasCore
  const initCanvasDirect = (
    canvasId: string,
    drawFn: (ctx: any, w: number, h: number) => void,
    retryCount = 0,
  ) => {
    const MAX_RETRY = 8;
    setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query
        .select(canvasId)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0] && res[0].node) {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = Taro.getSystemInfoSync().pixelRatio;
            const lw = res[0].width;
            const lh = res[0].height;
            canvas.width = lw * dpr;
            canvas.height = lh * dpr;
            ctx.scale(dpr, dpr);
            console.log(`[ResultPage] ${canvasId} init OK, size: ${lw}x${lh}`);
            drawFn(ctx, lw, lh);
          } else if (retryCount < MAX_RETRY) {
            console.warn(`[ResultPage] ${canvasId} retry ${retryCount + 1}/${MAX_RETRY}`);
            initCanvasDirect(canvasId, drawFn, retryCount + 1);
          } else {
            console.error(`[ResultPage] ${canvasId} init failed`);
          }
        });
    }, 150 + retryCount * 200);
  };

  // 绘制用户书写笔迹
  useEffect(() => {
    const strokes = sessionData?.userStrokes;
    if (!strokes?.length) {
      setUserCanvasReady(false);
      return;
    }

    initCanvasDirect('#userStrokeCanvas', (ctx, w, h) => {
      drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 6, gridSize: 1024 }, 'rgba(0,0,0,0.06)');

      // 使用 ref 获取最新数据
      const currentStrokes = userStrokesRef.current || strokes;
      if (currentStrokes.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const stroke of currentStrokes) {
          for (const pt of stroke) {
            const [x, y] = pt.split(',').map(Number);
            if (isNaN(x) || isNaN(y)) continue;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }

        if (minX === Infinity) {
          setUserCanvasReady(true);
          return;
        }

        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        const margin = 12;
        const drawW = w - margin * 2;
        const drawH = h - margin * 2;
        const scale = Math.min(drawW / rangeX, drawH / rangeY) * 0.9;

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const stroke of currentStrokes) {
          if (stroke.length < 2) continue;
          ctx.beginPath();
          const [sx, sy] = stroke[0].split(',').map(Number);
          const px0 = margin + (sx - minX) * scale + (drawW - rangeX * scale) / 2;
          const py0 = margin + (sy - minY) * scale + (drawH - rangeY * scale) / 2;
          ctx.moveTo(px0, py0);
          for (let i = 1; i < stroke.length; i++) {
            const [px, py] = stroke[i].split(',').map(Number);
            const cx = margin + (px - minX) * scale + (drawW - rangeX * scale) / 2;
            const cy = margin + (py - minY) * scale + (drawH - rangeY * scale) / 2;
            ctx.lineTo(cx, cy);
          }
          ctx.stroke();
        }
      }

      setUserCanvasReady(true);
    });
  }, [sessionData]);

  // 绘制标准字帖
  useEffect(() => {
    const charStr = (char as string) || sessionData?.char;
    if (!charStr) {
      setStdCanvasReady(false);
      return;
    }

    initCanvasDirect('#stdStrokeCanvas', (ctx, w, h) => {
      drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 6, gridSize: 1024 }, 'rgba(71,184,129,0.15)');

      const strokeData = getStrokeData(charStr);
      if (strokeData) {
        drawAllStrokeOutlines(ctx, strokeData.strokes, {
          canvasWidth: w, canvasHeight: h,
          margin: 12, gridSize: 1024,
          lineWidth: 2.5, lineCap: 'round', lineJoin: 'round',
        }, false, 'rgba(71, 184, 129, 0.35)');
      }

      setStdCanvasReady(true);
    });
  }, [char, sessionData]);

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
    Taro.showToast({ title: '点击右上角分享', icon: 'none' });
  };

  const handleContinue = () => {
    Taro.navigateTo({ url: '/sub-hanzi/hanzi-practice/index' });
  };

  const handleGoHome = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  return (
    <View className={styles.page}>
      <View className={classnames(styles.scoreCircle, styles[scoreInfo.level])}>
        <Text className={styles.scoreValue}>{scoreNum}</Text>
        <Text className={styles.scoreLabel}>分</Text>
      </View>

      <Text className={styles.encourage}>
        {scoreInfo.emoji} {scoreInfo.text}
      </Text>

      <View className={styles.detailSection}>
        <Text className={styles.detailTitle}>
          {isTest === '1' ? '测试' : '练习'}详情
        </Text>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>练习汉字</Text>
          <Text className={styles.detailValue}>{char}</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>综合评分</Text>
          <View className={styles.scoreBar}>
            <View
              className={styles.scoreBarFill}
              style={{ width: `${scoreNum}%`, background: 'linear-gradient(90deg, #47B881, #73D13D)' }}
            />
          </View>
          <Text className={styles.detailValue}>{scoreNum}分</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>笔画准确度</Text>
          <View className={styles.scoreBar}>
            <View
              className={styles.scoreBarFill}
              style={{ width: `${accuracyNum}%`, background: 'linear-gradient(90deg, #FFB347, #47B881)' }}
            />
          </View>
          <Text className={styles.detailValue}>{accuracyNum}%</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>书写美观度</Text>
          <View className={styles.scoreBar}>
            <View
              className={styles.scoreBarFill}
              style={{ width: `${aestheticsNum}%`, background: 'linear-gradient(90deg, #FF6B6B, #FFB347)' }}
            />
          </View>
          <Text className={styles.detailValue}>{aestheticsNum}%</Text>
        </View>
      </View>

      <View className={styles.compareSection}>
        <Text className={styles.detailTitle}>标准对比</Text>
        {isFromHistory ? (
          <View className={styles.noStrokeHint}>
            <Text className={styles.noStrokeText}>历史记录暂不支持笔迹回放</Text>
            <Text className={styles.noStrokeSub}>完成书写后立即查看可对比笔迹</Text>
          </View>
        ) : (
          <>
            <View className={styles.compareGrid}>
              <View className={styles.compareItem}>
                <View className={classnames(styles.compareChar, styles.yourChar)}>
                  <Canvas
                    id="userStrokeCanvas"
                    type="2d"
                    className={styles.compareCanvas}
                    style={{ visibility: userCanvasReady ? 'visible' : 'hidden' }}
                  />
                  {!userCanvasReady && (
                    <Text className={styles.compareFallback}>{char || sessionData?.char || '?'}</Text>
                  )}
                </View>
                <Text className={styles.compareLabel}>你的书写</Text>
              </View>
              <View className={styles.compareItem}>
                <View className={classnames(styles.compareChar, styles.standardChar)}>
                  <Canvas
                    id="stdStrokeCanvas"
                    type="2d"
                    className={styles.compareCanvas}
                    style={{ visibility: stdCanvasReady ? 'visible' : 'hidden' }}
                  />
                  {!stdCanvasReady && (
                    <Text className={styles.compareFallback}>{char || sessionData?.char || '?'}</Text>
                  )}
                </View>
                <Text className={styles.compareLabel}>标准字帖</Text>
              </View>
            </View>
            {improvementTips.length > 0 && (
              <View className={styles.improvement}>
                <Text className={styles.improvementTitle}>改进建议</Text>
                {improvementTips.map((tip, i) => (
                  <Text key={i} className={styles.improvementTip}>{i + 1}. {tip}</Text>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      <View className={styles.actions}>
        <View className={`${styles.actionBtn} ${styles.backBtn}`} onClick={handleGoHome}>
          <Text>返回首页</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.shareBtn}`} onClick={handleShare}>
          <Text>分享成果</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.continueBtn}`} onClick={handleContinue}>
          <Text>继续练字</Text>
        </View>
      </View>
    </View>
  );
};

export default ResultPage;
