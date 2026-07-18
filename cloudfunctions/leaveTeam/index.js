/**
 * leaveTeam - 离开队伍
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
      return { code: -1, message: '用户不存在' }
    }
    const userId = userResult.rows[0].id

    const memberResult = await client.query(
      'SELECT tm.team_id, t.captain_id FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.user_id = $1',
      [userId]
    )
    if (memberResult.rows.length === 0) {
      return { code: -1, message: '你不在任何队伍中' }
    }
    const { team_id, captain_id } = memberResult.rows[0]

    await client.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [team_id, userId])

    // 如果队长离开，解散队伍
    if (captain_id === userId) {
      await client.query('DELETE FROM team_members WHERE team_id = $1', [team_id])
      await client.query('DELETE FROM teams WHERE id = $1', [team_id])
    }

    return { code: 0, message: 'ok' }
  } catch (err) {
    console.error('[leaveTeam] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}
