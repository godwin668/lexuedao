/**
 * analyzeWeakPoints - 分析薄弱知识点
 * 查询最近30天练习记录和错题本，按学科统计薄弱点
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

    await client.connect()

    // 获取用户 ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const userId = userResult.rows[0].id

    // 查询最近30天练习记录，按学科统计
    const practiceStats = await client.query(
      `SELECT subject,
              COUNT(*) as total_count,
              SUM(CASE WHEN accuracy < 60 THEN 1 ELSE 0 END) as low_accuracy_count,
              ROUND(AVG(accuracy)) as avg_accuracy
       FROM practice_records
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY subject`,
      [userId]
    )

    // 查询错题本中未掌握的错题，按学科统计
    const errorStats = await client.query(
      `SELECT subject,
              COUNT(*) as error_item_count,
              SUM(error_count) as total_errors
       FROM error_book
       WHERE user_id = $1 AND mastered = FALSE
       GROUP BY subject`,
      [userId]
    )

    // 查询用户能力画像中的薄弱标签
    const skillProfile = await client.query(
      `SELECT subject, weak_tags, strong_tags
       FROM user_skill_profile
       WHERE user_id = $1`,
      [userId]
    )

    // 构建薄弱点数据
    const weakPointsMap = {}

    // 从练习记录统计
    for (const row of practiceStats.rows) {
      const errorRate = row.total_count > 0
        ? Math.round((row.low_accuracy_count / row.total_count) * 100)
        : 0
      weakPointsMap[row.subject] = {
        subject: row.subject,
        tags: [],
        errorRate,
        totalPractices: parseInt(row.total_count),
        avgAccuracy: parseInt(row.avg_accuracy) || 0
      }
    }

    // 从错题本补充标签
    for (const row of errorStats.rows) {
      if (!weakPointsMap[row.subject]) {
        weakPointsMap[row.subject] = {
          subject: row.subject,
          tags: [],
          errorRate: 0,
          totalPractices: 0,
          avgAccuracy: 0
        }
      }
      weakPointsMap[row.subject].errorItemCount = parseInt(row.error_item_count)
      weakPointsMap[row.subject].totalErrors = parseInt(row.total_errors)
    }

    // 从能力画像补充标签
    for (const row of skillProfile.rows) {
      if (!weakPointsMap[row.subject]) {
        weakPointsMap[row.subject] = {
          subject: row.subject,
          tags: [],
          errorRate: 0,
          totalPractices: 0,
          avgAccuracy: 0
        }
      }
      weakPointsMap[row.subject].tags = row.weak_tags || []
      weakPointsMap[row.subject].strongTags = row.strong_tags || []
    }

    const weakPoints = Object.values(weakPointsMap)

    // 生成建议
    const recommendations = []
    for (const wp of weakPoints) {
      const subjectName = { hanzi: '汉字', math: '数学', english: '英语' }[wp.subject] || wp.subject
      if (wp.errorRate > 30) {
        recommendations.push(`${subjectName}正确率较低（${wp.avgAccuracy}%），建议每天增加${subjectName}练习量`)
      }
      if (wp.tags && wp.tags.length > 0) {
        recommendations.push(`${subjectName}薄弱知识点：${wp.tags.slice(0, 5).join('、')}，建议针对性练习`)
      }
      if (wp.errorItemCount > 0) {
        recommendations.push(`${subjectName}有${wp.errorItemCount}个错题待复习，建议打开错题本巩固`)
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('暂无明显的薄弱知识点，继续保持当前学习节奏！')
    }

    return {
      code: 0,
      message: 'ok',
      data: { weakPoints, recommendations }
    }
  } catch (err) {
    console.error('[analyzeWeakPoints] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}
