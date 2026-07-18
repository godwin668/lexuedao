/**
 * bindChild - 家长绑定孩子
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

    const { childOpenid, relation = '' } = event

    if (!childOpenid) {
      return { code: -1, message: '缺少孩子 openid' }
    }

    const validRelations = ['', '爸爸', '妈妈', '爷爷', '奶奶', '外公', '外婆']
    if (relation && !validRelations.includes(relation)) {
      return { code: -1, message: '无效的关系类型' }
    }

    await client.connect()

    // 验证调用者是家长角色
    const parentResult = await client.query(
      'SELECT id, role FROM users WHERE openid = $1',
      [openid]
    )
    if (parentResult.rows.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    if (parentResult.rows[0].role !== 'parent') {
      return { code: -1, message: '只有家长可以绑定孩子' }
    }
    const parentId = parentResult.rows[0].id

    // 查找孩子用户
    const childResult = await client.query(
      'SELECT id, role, nickname FROM users WHERE openid = $1',
      [childOpenid]
    )
    if (childResult.rows.length === 0) {
      return { code: -1, message: '孩子用户不存在，请确认 openid 是否正确' }
    }
    if (childResult.rows[0].role !== 'student') {
      return { code: -1, message: '只能绑定学生角色的用户' }
    }
    const childId = childResult.rows[0].id

    // 不能绑定自己
    if (parentId === childId) {
      return { code: -1, message: '不能绑定自己' }
    }

    // 检查是否已绑定
    const existResult = await client.query(
      'SELECT id, is_active FROM parent_child WHERE parent_id = $1 AND child_id = $2',
      [parentId, childId]
    )

    if (existResult.rows.length > 0) {
      if (existResult.rows[0].is_active) {
        return { code: -1, message: '已绑定该孩子，无需重复绑定' }
      }
      // 重新激活绑定
      await client.query(
        `UPDATE parent_child SET is_active = TRUE, relation = $1, created_at = NOW()
         WHERE parent_id = $2 AND child_id = $3`,
        [relation, parentId, childId]
      )
    } else {
      // 创建新绑定
      await client.query(
        `INSERT INTO parent_child (parent_id, child_id, relation)
         VALUES ($1, $2, $3)`,
        [parentId, childId, relation]
      )
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        parentId,
        childId,
        childNickname: childResult.rows[0].nickname,
        relation,
        bound: true
      }
    }
  } catch (err) {
    console.error('[bindChild] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}
