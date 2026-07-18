/**
 * getChildList - 获取绑定孩子列表
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

    // 获取当前用户
    const userResult = await client.query(
      'SELECT id, role FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const userId = userResult.rows[0].id
    const role = userResult.rows[0].role

    let children = []

    if (role === 'parent') {
      // 家长：查询绑定的孩子
      const result = await client.query(
        `SELECT pc.id as bind_id, pc.relation, pc.is_active, pc.created_at as bound_at,
                u.id as child_id, u.nickname, u.avatar_url, u.grade
         FROM parent_child pc
         JOIN users u ON pc.child_id = u.id
         WHERE pc.parent_id = $1 AND pc.is_active = TRUE
         ORDER BY pc.created_at DESC`,
        [userId]
      )
      children = result.rows.map(r => ({
        bindId: r.bind_id,
        childId: r.child_id,
        nickname: r.nickname,
        avatarUrl: r.avatar_url,
        grade: r.grade,
        relation: r.relation,
        boundAt: r.bound_at
      }))
    } else {
      // 学生：查询被哪些家长绑定
      const result = await client.query(
        `SELECT pc.id as bind_id, pc.relation, pc.is_active, pc.created_at as bound_at,
                u.id as parent_id, u.nickname, u.avatar_url
         FROM parent_child pc
         JOIN users u ON pc.parent_id = u.id
         WHERE pc.child_id = $1 AND pc.is_active = TRUE
         ORDER BY pc.created_at DESC`,
        [userId]
      )
      children = result.rows.map(r => ({
        bindId: r.bind_id,
        parentId: r.parent_id,
        nickname: r.nickname,
        avatarUrl: r.avatar_url,
        relation: r.relation,
        boundAt: r.bound_at
      }))
    }

    return {
      code: 0,
      message: 'ok',
      data: { role, children }
    }
  } catch (err) {
    console.error('[getChildList] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}
