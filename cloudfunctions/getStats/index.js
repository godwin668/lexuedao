/**
 * getStats - 获取学习统计数据
 * 利用 PG 窗口函数和聚合查询
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

    const userResult = await client.query(
      'SELECT id FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: 0, message: 'success', data: null }
    }
    const userId = userResult.rows[0].id
    const subject = event.subject || null

    let subjectFilter = ''
    const params = [userId]
    let paramIdx = 2
    if (subject) {
      subjectFilter = ` AND subject = $${paramIdx++}`
      params.push(subject)
    }

    // 总练习数
    const practiceCount = await client.query(
      `SELECT COUNT(*) as total FROM practice_records WHERE user_id = $1 AND type = 'practice' ${subjectFilter}`,
      params
    )

    // 总测试数
    const testCount = await client.query(
      `SELECT COUNT(*) as total FROM practice_records WHERE user_id = $1 AND type = 'test' ${subjectFilter}`,
      params
    )

    // 平均分
    const avgResult = await client.query(
      `SELECT COALESCE(AVG(score), 0) as avg_score, COALESCE(AVG(accuracy), 0) as avg_accuracy
       FROM practice_records WHERE user_id = $1 ${subjectFilter}`,
      params
    )

    // 练字数（从 content_json 中提取去重汉字）
    const charResult = await client.query(
      `SELECT COUNT(DISTINCT content_json->>'character') as total
       FROM practice_records
       WHERE user_id = $1 AND type = 'practice' AND content_json->>'character' IS NOT NULL ${subjectFilter}`,
      params
    )

    // 本周趋势（7天）
    const weeklyResult = await client.query(
      `SELECT
         to_char(d.date, 'Day') as day_name,
         COALESCE(COUNT(pr.id), 0) as count,
         COALESCE(ROUND(AVG(pr.score)), 0) as score
       FROM generate_series(
         date_trunc('day', NOW()) - INTERVAL '6 days',
         date_trunc('day', NOW()),
         '1 day'
       ) d(date)
       LEFT JOIN practice_records pr
         ON pr.user_id = $1
         AND date_trunc('day', pr.created_at) = d.date
         ${subject ? `AND pr.subject = $${paramIdx}` : ''}
       GROUP BY d.date
       ORDER BY d.date`,
      subject ? [userId, subject] : [userId]
    )

    // 月度趋势（6个月）
    const monthlyResult = await client.query(
      `SELECT
         to_char(d.month, 'FMMM月') as month_name,
         COALESCE(COUNT(pr.id), 0) as count,
         COALESCE(ROUND(AVG(pr.score)), 0) as score
       FROM generate_series(
         date_trunc('month', NOW()) - INTERVAL '5 months',
         date_trunc('month', NOW()),
         '1 month'
       ) d(month)
       LEFT JOIN practice_records pr
         ON pr.user_id = $1
         AND date_trunc('month', pr.created_at) = d.month
         ${subject ? `AND pr.subject = $${paramIdx}` : ''}
       GROUP BY d.month
       ORDER BY d.month`,
      subject ? [userId, subject] : [userId]
    )

    return {
      code: 0,
      message: 'success',
      data: {
        totalPractices: parseInt(practiceCount.rows[0].total),
        totalTests: parseInt(testCount.rows[0].total),
        totalCharacters: parseInt(charResult.rows[0].total),
        avgScore: Math.round(parseFloat(avgResult.rows[0].avg_score)),
        correctRate: Math.round(parseFloat(avgResult.rows[0].avg_accuracy)),
        weeklyData: weeklyResult.rows.map(r => ({
          date: r.day_name.trim(),
          count: parseInt(r.count),
          score: parseInt(r.score),
        })),
        monthlyData: monthlyResult.rows.map(r => ({
          month: r.month_name,
          count: parseInt(r.count),
          score: parseInt(r.score),
        })),
      },
    }
  } catch (err) {
    console.error('[getStats] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}
