/**
 * getTeamInfo - 获取队伍信息
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
      `SELECT tm.team_id FROM team_members tm WHERE tm.user_id = $1`,
      [userId]
    )
    if (memberResult.rows.length === 0) {
      return { code: 0, message: 'ok', data: null }
    }
    const teamId = memberResult.rows[0].team_id

    const teamResult = await client.query(
      'SELECT id, name, code, captain_id, total_score, current_stage, total_stages FROM teams WHERE id = $1',
      [teamId]
    )
    if (teamResult.rows.length === 0) {
      return { code: 0, message: 'ok', data: null }
    }
    const team = teamResult.rows[0]

    const membersResult = await client.query(
      `SELECT u.id, u.nickname
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at`,
      [teamId]
    )

    return {
      code: 0,
      message: 'ok',
      data: {
        id: team.id,
        name: team.name,
        code: team.code,
        captainId: team.captain_id,
        totalScore: team.total_score,
        currentStage: team.current_stage,
        totalStages: team.total_stages,
        members: membersResult.rows.map(r => ({ id: r.id, nickname: r.nickname })),
      },
    }
  } catch (err) {
    console.error('[getTeamInfo] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}
