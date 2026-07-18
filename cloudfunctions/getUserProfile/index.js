/**
 * getUserProfile - 获取用户信息
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
      `SELECT id, openid, nickname, avatar_url, role, grade,
              is_vip, vip_expire_date, total_study_minutes,
              created_at, updated_at
       FROM users WHERE openid = $1`,
      [openid]
    )

    if (result.rows.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }

    const row = result.rows[0]
    return {
      code: 0,
      message: 'success',
      data: {
        id: row.id,
        openid: row.openid,
        nickname: row.nickname,
        avatarUrl: row.avatar_url,
        role: row.role,
        grade: row.grade,
        isVip: row.is_vip || false,
        vipExpireDate: row.vip_expire_date,
        totalStudyMinutes: row.total_study_minutes || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    }
  } catch (err) {
    console.error('[getUserProfile] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}
