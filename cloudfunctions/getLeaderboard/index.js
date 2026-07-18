/**
 * getLeaderboard - 获取排行榜
 * 支持按学科、范围（班级/全校/全国/好友）筛选
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

    const subject = event.subject || null
    const scope = event.scope || 'national'
    const page = event.page || 1
    const pageSize = event.pageSize || 20
    const offset = (page - 1) * pageSize

    // 获取当前用户年级（用于班级/学校范围）
    const userResult = await client.query(
      'SELECT id, grade FROM users WHERE openid = $1',
      [openid]
    )
    const userGrade = userResult.rows.length > 0 ? userResult.rows[0].grade : null

    let whereClause = 'WHERE 1=1'
    const params = []
    let paramIdx = 1

    if (subject) {
      whereClause += ` AND pr.subject = $${paramIdx++}`
      params.push(subject)
    }

    if (scope === 'class' && userGrade) {
      whereClause += ` AND u.grade = $${paramIdx++}`
      params.push(userGrade)
    }

    // 按经验值排名
    const result = await client.query(
      `SELECT
         u.id as user_id,
         u.nickname,
         u.avatar_url,
         u.grade,
         ugp.level,
         ugp.exp,
         COALESCE(pr_stats.total_practices, 0) as total_practices,
         COALESCE(pr_stats.avg_score, 0) as avg_score,
         ROW_NUMBER() OVER (ORDER BY ugp.exp DESC) as rank
       FROM user_game_profile ugp
       JOIN users u ON u.id = ugp.user_id
       LEFT JOIN (
         SELECT user_id,
                COUNT(*) as total_practices,
                ROUND(AVG(score)) as avg_score
         FROM practice_records
         ${subject ? `WHERE subject = $${paramIdx}` : 'WHERE 1=1'}
         GROUP BY user_id
       ) pr_stats ON pr_stats.user_id = ugp.user_id
       ${whereClause}
       ORDER BY ugp.exp DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, pageSize, offset]
    )

    const list = result.rows.map(row => ({
      rank: parseInt(row.rank),
      userId: row.user_id,
      nickname: row.nickname,
      avatarUrl: row.avatar_url,
      grade: row.grade,
      level: row.level,
      exp: row.exp,
      totalPractices: parseInt(row.total_practices),
      avgScore: parseInt(row.avg_score),
    }))

    return { code: 0, message: 'success', data: list }
  } catch (err) {
    console.error('[getLeaderboard] error:', err)
    return { code: -1, message: err.message || '服务异常', data: [] }
  } finally {
    await client.end()
  }
}
