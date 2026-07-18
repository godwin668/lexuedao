/**
 * getAchievements - 获取所有成就定义
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    await client.connect()

    const result = await client.query(
      `SELECT id, key, name, description, icon, subject, condition_json, created_at
       FROM achievements
       ORDER BY subject, id`
    )

    const list = result.rows.map(row => ({
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description,
      icon: row.icon,
      subject: row.subject,
      conditionJson: row.condition_json,
      createdAt: row.created_at,
    }))

    return { code: 0, message: 'success', data: list }
  } catch (err) {
    console.error('[getAchievements] error:', err)
    return { code: -1, message: err.message || '服务异常', data: [] }
  } finally {
    await client.end()
  }
}
