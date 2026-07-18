/**
 * getLearningReport - 生成学习报告
 * 支持家长查看孩子报告（传入 childId）
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { childId, period = 'week' } = event

    await client.connect()

    // 确定查询的用户 ID
    let targetUserId
    if (childId) {
      // 家长查看孩子报告：验证绑定关系
      const parentResult = await client.query(
        'SELECT id FROM users WHERE openid = $1 AND role = $2',
        [openid, 'parent']
      )
      if (parentResult.rows.length === 0) {
        return { code: -1, message: '只有家长可以查看孩子报告' }
      }
      const parentId = parentResult.rows[0].id

      const bindResult = await client.query(
        `SELECT child_id FROM parent_child
         WHERE parent_id = $1 AND child_id = $2 AND is_active = TRUE`,
        [parentId, childId]
      )
      if (bindResult.rows.length === 0) {
        return { code: -1, message: '未绑定该孩子或绑定已失效' }
      }
      targetUserId = childId
    } else {
      const userResult = await client.query(
        'SELECT id FROM users WHERE openid = $1',
        [openid]
      )
      if (userResult.rows.length === 0) {
        return { code: -1, message: '用户不存在' }
      }
      targetUserId = userResult.rows[0].id
    }

    // 确定时间范围
    const interval = period === 'month' ? "INTERVAL '30 days'" : "INTERVAL '7 days'"

    // 查询练习记录统计
    const practiceStats = await client.query(
      `SELECT
         COUNT(*) as total_count,
         COALESCE(SUM(duration), 0) as total_duration,
         ROUND(AVG(accuracy)) as avg_accuracy,
         COALESCE(SUM(exp_gained), 0) as total_exp,
         COALESCE(SUM(coins_gained), 0) as total_coins
       FROM practice_records
       WHERE user_id = $1 AND created_at >= NOW() - ${interval}`,
      [targetUserId]
    )

    // 按学科统计
    const subjectStats = await client.query(
      `SELECT subject,
              COUNT(*) as count,
              ROUND(AVG(accuracy)) as avg_accuracy,
              COALESCE(SUM(duration), 0) as total_duration
       FROM practice_records
       WHERE user_id = $1 AND created_at >= NOW() - ${interval}
       GROUP BY subject
       ORDER BY count DESC`,
      [targetUserId]
    )

    // 按类型统计
    const typeStats = await client.query(
      `SELECT type,
              COUNT(*) as count,
              ROUND(AVG(accuracy)) as avg_accuracy
       FROM practice_records
       WHERE user_id = $1 AND created_at >= NOW() - ${interval}
       GROUP BY type
       ORDER BY count DESC`,
      [targetUserId]
    )

    // 错题本统计
    const errorStats = await client.query(
      `SELECT
         COUNT(*) as total_error_items,
         COALESCE(SUM(error_count), 0) as total_errors,
         COUNT(CASE WHEN mastered = TRUE THEN 1 END) as mastered_count
       FROM error_book
       WHERE user_id = $1`,
      [targetUserId]
    )

    // 连续打卡天数
    const streakResult = await client.query(
      `SELECT streak_days FROM user_game_profile WHERE user_id = $1`,
      [targetUserId]
    )
    const streakDays = streakResult.rows.length > 0 ? streakResult.rows[0].streak_days : 0

    // 获取用户信息
    const userInfo = await client.query(
      'SELECT nickname, grade FROM users WHERE id = $1',
      [targetUserId]
    )
    const userName = userInfo.rows.length > 0 ? userInfo.rows[0].nickname : ''
    const userGrade = userInfo.rows.length > 0 ? userInfo.rows[0].grade : 0

    const stats = practiceStats.rows[0]

    // 获取薄弱知识点
    let weakPoints = []
    try {
      const weakResult = await client.query(
        `SELECT item_key, error_count FROM error_book
         WHERE user_id = $1 AND mastered = false
         ORDER BY error_count DESC LIMIT 5`,
        [targetUserId]
      )
      weakPoints = weakResult.rows.map(r => r.item_key)
    } catch (_) {}

    // 生成改进建议
    const recommendations = []
    if (parseInt(stats.avg_accuracy) < 70) {
      recommendations.push('正确率偏低，建议从基础题开始，逐步提升难度')
    }
    if (parseInt(stats.total_count) < 10) {
      recommendations.push('本周练习次数较少，建议每天至少完成一组练习')
    }
    if (weakPoints.length > 0) {
      recommendations.push('错题本中有未掌握的题目，建议优先复习错题')
    }
    if (streakDays < 3) {
      recommendations.push('连续打卡天数不足，坚持每天学习可获得额外奖励')
    }
    if (recommendations.length === 0) {
      recommendations.push('表现不错！继续保持当前的学习节奏')
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        period,
        userName,
        grade: userGrade,
        streakDays,
        weakPoints,
        recommendations,
        summary: {
          totalPractices: parseInt(stats.total_count) || 0,
          totalDuration: parseInt(stats.total_duration) || 0,
          avgAccuracy: parseInt(stats.avg_accuracy) || 0,
          totalExp: parseInt(stats.total_exp) || 0,
          totalCoins: parseInt(stats.total_coins) || 0
        },
        subjectDistribution: subjectStats.rows.map(r => ({
          subject: r.subject,
          count: parseInt(r.count),
          avgAccuracy: parseInt(r.avg_accuracy) || 0,
          totalDuration: parseInt(r.total_duration) || 0
        })),
        typeDistribution: typeStats.rows.map(r => ({
          type: r.type,
          count: parseInt(r.count),
          avgAccuracy: parseInt(r.avg_accuracy) || 0
        })),
        errorBook: {
          totalErrorItems: parseInt(errorStats.rows[0].total_error_items) || 0,
          totalErrors: parseInt(errorStats.rows[0].total_errors) || 0,
          masteredCount: parseInt(errorStats.rows[0].mastered_count) || 0
        }
      }
    }
  } catch (err) {
    console.error('[getLearningReport] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}
