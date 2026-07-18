/**
 * joinTeam - 加入队伍
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
    const { code } = event

    if (!code || !code.trim()) {
      return { code: -1, message: '队伍码不能为空' }
    }

    await client.connect()

    const userResult = await client.query(
      'SELECT id, nickname FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const userId = userResult.rows[0].id

    // 检查是否已在队伍中
    const existing = await client.query(
      'SELECT id FROM team_members WHERE user_id = $1',
      [userId]
    )
    if (existing.rows.length > 0) {
      return { code: -1, message: '你已经在队伍中，请先离开当前队伍' }
    }

    // 查找队伍
    const teamResult = await client.query(
      'SELECT id, name, code, captain_id, total_score, current_stage, total_stages FROM teams WHERE code = $1',
      [code.trim().toUpperCase()]
    )
    if (teamResult.rows.length === 0) {
      return { code: -1, message: '队伍码无效，未找到对应队伍' }
    }
    const team = teamResult.rows[0]

    // 检查人数上限
    const countResult = await client.query(
      'SELECT COUNT(*) as cnt FROM team_members WHERE team_id = $1',
      [team.id]
    )
    if (parseInt(countResult.rows[0].cnt) >= 5) {
      return { code: -1, message: '队伍已满（最多5人）' }
    }

    await client.query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)`,
      [team.id, userId]
    )

    // 获取成员列表
    const membersResult = await client.query(
      `SELECT u.id, u.nickname
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1`,
      [team.id]
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
    console.error('[joinTeam] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}
