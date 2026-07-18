/**
 * getUserAchievements - 获取用户已解锁的成就列表
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

    const result = await client.query(
      `SELECT ua.id, ua.achievement_key, ua.unlocked_at,
              a.name, a.description, a.icon, a.subject, a.condition_json
       FROM user_achievements ua
       JOIN users u ON u.id = ua.user_id
       JOIN achievements a ON a.key = ua.achievement_key
       WHERE u.openid = $1
       ORDER BY ua.unlocked_at DESC`,
      [openid]
    )

    const list = result.rows.map(row => ({
      id: row.id,
      achievementKey: row.achievement_key,
      name: row.name,
      description: row.description,
      icon: row.icon,
      subject: row.subject,
      conditionJson: row.condition_json,
      unlockedAt: row.unlocked_at,
    }))

    return { code: 0, message: 'success', data: list }
  } catch (err) {
    console.error('[getUserAchievements] error:', err)
    return { code: -1, message: err.message || '服务异常', data: [] }
  } finally {
    await client.end()
  }
}
