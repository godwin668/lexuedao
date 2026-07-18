/**
 * login - 微信登录，返回 openid
 * 使用 CloudBase PG 数据库
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

    // 查找或创建用户
    let result = await client.query(
      'SELECT id, openid, nickname, avatar_url, role, grade, created_at, updated_at FROM users WHERE openid = $1',
      [openid]
    )

    if (result.rows.length === 0) {
      result = await client.query(
        `INSERT INTO users (openid, nickname, avatar_url, role, grade)
         VALUES ($1, '小朋友', '', 'student', 1)
         RETURNING id, openid, nickname, avatar_url, role, grade, created_at, updated_at`,
        [openid]
      )

      // 同时创建游戏档案
      await client.query(
        'INSERT INTO user_game_profile (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
        [result.rows[0].id]
      )
    }

    return {
      code: 0,
      message: 'success',
      data: {
        openid,
        userId: result.rows[0].id,
      },
    }
  } catch (err) {
    console.error('[login] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}
