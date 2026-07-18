/**
 * getGameProfile - 获取用户游戏属性（等级/经验/金币等）
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
      `SELECT ugp.*
       FROM user_game_profile ugp
       JOIN users u ON u.id = ugp.user_id
       WHERE u.openid = $1`,
      [openid]
    )

    if (result.rows.length === 0) {
      return { code: 0, message: 'success', data: null }
    }

    const row = result.rows[0]
    return {
      code: 0,
      message: 'success',
      data: {
        userId: row.user_id,
        level: row.level,
        exp: row.exp,
        coins: row.coins,
        diamonds: row.diamonds,
        energy: row.energy,
        energyMax: row.energy_max,
        streakDays: row.streak_days,
        lastLoginDate: row.last_login_date,
      },
    }
  } catch (err) {
    console.error('[getGameProfile] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}
